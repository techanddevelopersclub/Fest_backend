const PendingParticipantRepo = require("../repositories/pendingParticipant");
const Participant = require("../models/Participant");
const { applicationDB } = require("../../database");
const RejectedParticipantRepo = require("../repositories/rejectedParticipant");
const FeatureFlagService = require("../services/featureFlag");
const Mailer = require("../services/mailer");
const UserRepo = require("../repositories/user");

// Create a new pending participant
exports.createPendingParticipant = async (req, res) => {
  try {
    const {
      event,
      leader,
      isTeam,
      teamName,
      members,
      paymentProofUrl,
    } = req.body;
    const pending = await PendingParticipantRepo.create({
      event,
      leader,
      isTeam,
      teamName,
      members,
      paymentProofUrl,
      paymentStatus: "pending",
    });
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
    // Move to Participant table using main application DB connection
    const ParticipantModel = Participant(applicationDB);
    const participant = await ParticipantModel.create({
      event: pending.event,
      leader: pending.leader,
      isTeam: pending.isTeam,
      teamName: pending.teamName,
      members: pending.members,
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
        if (user?.email) {
          await Mailer.sendMail({
            from: process.env.MAILING_SERVICE_USER,
            to: user.email,
            subject: "Your event registration payment is verified",
            html: `<p>Your payment for event ${String(pending.event)} has been verified.</p>`,
          });
        }
      }
    } catch (_) {}

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
    // Move to RejectedParticipant table
    const rejected = await RejectedParticipantRepo.create({
      event: pending.event,
      leader: pending.leader,
      isTeam: pending.isTeam,
      teamName: pending.teamName,
      members: pending.members,
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
