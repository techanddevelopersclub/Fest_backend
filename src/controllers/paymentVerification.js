const PendingParticipantRepo = require("../repositories/pendingParticipant");
const PendingEntryPassRepo = require("../repositories/pendingEntryPass");

exports.listAllPendingPayments = async (req, res) => {
  try {
    const pendingParticipants = await PendingParticipantRepo.find({ paymentStatus: "pending" });
    const pendingEntryPasses = await PendingEntryPassRepo.find({ paymentStatus: "pending" });
    res.json({ participants: pendingParticipants, entryPasses: pendingEntryPasses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { type, id } = req.body; // type: 'participant' or 'entryPass'
    if (type === "participant") {
      const pending = await PendingParticipantRepo.findById(id);
      if (!pending) return res.status(404).json({ error: "Not found" });
      pending.paymentStatus = "verified";
      await pending.save();
      return res.json({ success: true });
    } else if (type === "entryPass") {
      const pending = await PendingEntryPassRepo.findById(id);
      if (!pending) return res.status(404).json({ error: "Not found" });
      pending.paymentStatus = "verified";
      await pending.save();
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Invalid type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const { type, id, reason } = req.body;
    if (type === "participant") {
      const pending = await PendingParticipantRepo.findById(id);
      if (!pending) return res.status(404).json({ error: "Not found" });
      pending.paymentStatus = "rejected";
      pending.rejectionReason = reason || "";
      await pending.save();
      return res.json({ success: true });
    } else if (type === "entryPass") {
      const pending = await PendingEntryPassRepo.findById(id);
      if (!pending) return res.status(404).json({ error: "Not found" });
      pending.paymentStatus = "rejected";
      pending.rejectionReason = reason || "";
      await pending.save();
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Invalid type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
