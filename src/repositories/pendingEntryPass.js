const { applicationDB } = require("../../database");
const PendingEntryPass = require("../models/PendingEntryPass")(applicationDB);

module.exports = {
  create: (data) => PendingEntryPass.create(data),
  findById: (id) => PendingEntryPass.findById(id),
  findByIdAndDelete: (id) => PendingEntryPass.findByIdAndDelete(id),
  find: (query) => PendingEntryPass.find(query),
  count: (query) => PendingEntryPass.countDocuments(query),
};
