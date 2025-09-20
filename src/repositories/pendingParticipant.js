const { applicationDB } = require("../../database");
const PendingParticipant = require("../models/PendingParticipant")(applicationDB);

module.exports = {
  create: (data) => PendingParticipant.create(data),
  findById: (id) => PendingParticipant.findById(id),
  findByIdAndDelete: (id) => PendingParticipant.findByIdAndDelete(id),
  find: (query) => PendingParticipant.find(query),
  count: (query) => PendingParticipant.countDocuments(query),
};
