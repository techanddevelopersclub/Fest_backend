const RejectedTransactionRepo = require("../repositories/rejectedParticipant");

// Create a rejected transaction (for admin/manual use)
exports.createRejectedTransaction = async (req, res) => {
  try {
    const {
      event,
      leader,
      isTeam,
      teamName,
      members,
      paymentProofUrl,
      rejectionReason,
    } = req.body;
    const rejected = await RejectedTransactionRepo.create({
      event,
      leader,
      isTeam,
      teamName,
      members,
      paymentProofUrl,
      rejectionReason,
      rejectedAt: new Date(),
    });
    res.status(201).json(rejected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all rejected transactions
exports.listRejectedTransactions = async (req, res) => {
  try {
    const list = await RejectedTransactionRepo.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
