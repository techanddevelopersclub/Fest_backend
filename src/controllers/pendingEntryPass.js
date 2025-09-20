const PendingEntryPassRepo = require("../repositories/pendingEntryPass");

// Create a new pending entry pass
exports.createPendingEntryPass = async (req, res) => {
  try {
    const { event, user, paymentProofUrl } = req.body;
    const pending = await PendingEntryPassRepo.create({
      event,
      user,
      paymentProofUrl,
      paymentStatus: "pending",
    });
    res.status(201).json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const EntryPassRepo = require("../repositories/entryPass");
const FeatureFlagService = require("../services/featureFlag");
const Mailer = require("../services/mailer");
const UserRepo = require("../repositories/user");

// Verify a pending entry pass (move to EntryPass table)
exports.verifyPendingEntryPass = async (req, res) => {
  try {
    const { id } = req.params;
    const pending = await PendingEntryPassRepo.findById(id);
    if (!pending) return res.status(404).json({ error: "Not found" });
    if (pending.paymentStatus !== "pending") {
      return res.status(400).json({ error: "Entry pass is not pending" });
    }
    // Create EntryPass
    const entryPass = await EntryPassRepo.create(pending.user, pending.event);
    // Update pending entry pass status and remove
  pending.paymentStatus = "verified";
  pending.verifiedBy = req.user?._id || null;
  pending.verifiedAt = new Date();
    await pending.save();
    await PendingEntryPassRepo.findByIdAndDelete(id);
  // Optionally send email
  try {
    const flag = await FeatureFlagService.getByName("PAYMENT_VERIFICATION_EMAILS");
    if (flag?.enabled) {
      const user = await UserRepo.getById(pending.user);
      if (user?.email) {
        await Mailer.sendMail({
          from: process.env.MAILING_SERVICE_USER,
          to: user.email,
          subject: "Your entry pass payment is verified",
          html: `<p>Your payment for entry pass has been verified for event ${String(pending.event)}</p>`,
        });
      }
    }
  } catch (_) {}
  res.status(201).json({ entryPass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Reject a pending entry pass
exports.rejectPendingEntryPass = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    const pending = await PendingEntryPassRepo.findById(id);
    if (!pending) return res.status(404).json({ error: "Not found" });
    pending.paymentStatus = "rejected";
    pending.rejectionReason = reason || "";
    pending.rejectedBy = req.user?._id || null;
    pending.rejectedAt = new Date();
    await pending.save();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all pending entry passes with filters, search, pagination
exports.listPendingEntryPasses = async (req, res) => {
  try {
    const {
      event,
      user,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const query = { paymentStatus: "pending" };
    if (event) query.event = event;
    if (user) query.user = user;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      PendingEntryPassRepo.find(query)
        .populate("user", "name email")
        .populate("event", "name entryPassPriceInINR")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      PendingEntryPassRepo.count(query),
    ]);

    res.json({ items, page: Number(page), limit: Number(limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
