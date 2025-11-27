const PendingParticipantRepo = require("../repositories/pendingParticipant");
const Participant = require("../models/Participant");
const { applicationDB } = require("../../database");
const RejectedParticipantRepo = require("../repositories/rejectedParticipant");
const FeatureFlagService = require("../services/featureFlag");
const Mailer = require("../services/mailer");
const UserRepo = require("../repositories/user");
const PaymentLogService = require("../services/paymentLog");
const EventRepo = require("../repositories/event");

// Create a new pending participant
exports.createPendingParticipant = async (req, res) => {
  try {
    const {
      event,
      leader,
      isTeam,
      teamName,
      members,
      teamMemberNames,
      teamSize,
      paymentProofUrl,
      amount,
    } = req.body;

    // Normalize and dedupe teamMemberNames if provided
    let normalizedTeamMemberNames = undefined;
    let computedTeamSize = teamSize;
    if (Array.isArray(teamMemberNames) && teamMemberNames.length > 0) {
      normalizedTeamMemberNames = [...new Set(teamMemberNames.map(n => (n || "").trim()).filter(Boolean))];
      try {
        const leaderUser = await UserRepo.getById(leader);
        // user repo returns user object; we use leaderUser.name to check inclusion
        const leaderName = leaderUser?.name ? leaderUser.name.trim().toLowerCase() : null;
        const includesLeader = leaderName && normalizedTeamMemberNames.map(n => n.toLowerCase()).includes(leaderName);
        computedTeamSize = includesLeader ? normalizedTeamMemberNames.length : 1 + normalizedTeamMemberNames.length;
      } catch (err) {
        computedTeamSize = normalizedTeamMemberNames.length;
      }
    }
    const pending = await PendingParticipantRepo.create({
      event,
      leader,
      isTeam,
      teamName,
      members,
      teamMemberNames: normalizedTeamMemberNames || teamMemberNames,
      teamSize: computedTeamSize || teamSize,
      paymentProofUrl,
      paymentStatus: "pending",
    });

    // Log payment submission
    try {
      await PaymentLogService.createPaymentLogFromPending(
        {
          ...pending.toObject(),
          paymentType: "participant",
          amount: amount || 0,
          paymentProofUrl: paymentProofUrl || ""
        },
        "submitted",
        null,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID
        }
      );
    } catch (logError) {
      console.error("Failed to log payment submission:", logError);
      // Don't fail the main operation if logging fails
    }

    res.status(201).json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify a pending participant (move to Participant table)
exports.verifyPendingParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const pending = await PendingParticipantRepo.findById(id);
    if (!pending) return res.status(404).json({ error: "Not found" });
    
    // Log payment verification before processing
    try {
      await PaymentLogService.createPaymentLogFromPending(
        {
          ...pending.toObject(),
          paymentType: "participant"
        },
        "verified",
        req.user?._id,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID
        }
      );
    } catch (logError) {
      console.error("Failed to log payment verification:", logError);
      // Continue with verification even if logging fails
    }

    // Move to Participant table using main application DB connection
    const ParticipantModel = Participant(applicationDB);
    const participant = await ParticipantModel.create({
      event: pending.event,
      leader: pending.leader,
      isTeam: pending.isTeam,
      teamName: pending.teamName,
      members: pending.members,
      teamMemberNames: pending.teamMemberNames,
      teamSize: pending.teamSize,
    });
    // Remove from pending and mark audit on pending before deletion
    pending.paymentStatus = "verified";
    pending.verifiedBy = req.user?._id || null;
    pending.verifiedAt = new Date();
    await pending.save();
    await PendingParticipantRepo.findByIdAndDelete(id);

    // Optional email
    try {
      const flag = await FeatureFlagService.getByName("PAYMENT_VERIFICATION_EMAILS");
      if (flag?.enabled) {
        const user = await UserRepo.getById(pending.leader);
        const event = await EventRepo.getById(pending.event);
        
        if (user?.email && event && participant) {
          await Mailer.sendParticipantVerificationEmail({
            user,
            event,
            participant,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send participant verification email:", emailError);
      // Don't fail the verification if email fails
    }

    res.json(participant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject a pending participant and move to RejectedParticipant table
exports.rejectPendingParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    const pending = await PendingParticipantRepo.findById(id);
    if (!pending) return res.status(404).json({ error: "Not found" });

    // Log payment rejection before processing
    try {
      await PaymentLogService.createPaymentLogFromPending(
        {
          ...pending.toObject(),
          paymentType: "participant"
        },
        "rejected",
        req.user?._id,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          rejectionReason: reason
        }
      );
    } catch (logError) {
      console.error("Failed to log payment rejection:", logError);
      // Continue with rejection even if logging fails
    }

    // Move to RejectedParticipant table
    const rejected = await RejectedParticipantRepo.create({
      event: pending.event,
      leader: pending.leader,
      isTeam: pending.isTeam,
      teamName: pending.teamName,
      members: pending.members,
      teamMemberNames: pending.teamMemberNames,
      teamSize: pending.teamSize,
      paymentProofUrl: pending.paymentProofUrl,
      rejectionReason: reason || "",
      rejectedAt: new Date(),
      rejectedBy: req.user?._id || null,
    });
    // Remove from pending
    await PendingParticipantRepo.findByIdAndDelete(id);
    res.json(rejected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all pending participants with filters, search, pagination
exports.listPendingParticipants = async (req, res) => {
  try {
    const {
      event,
      leader,
      q,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const query = { paymentStatus: "pending" };
    if (event) query.event = event;
    if (leader) query.leader = leader;

    // Basic text search on teamName when q provided
    if (q) {
      query.teamName = { $regex: q, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      PendingParticipantRepo.find(query)
        .populate("leader", "name email")
        .populate("event", "name registrationFeesInINR")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      PendingParticipantRepo.count(query),
    ]);

    res.json({ items, page: Number(page), limit: Number(limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
