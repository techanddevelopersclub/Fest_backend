const { applicationDB } = require("../../database");
const RejectedParticipant = require("../models/RejectedParticipant")(applicationDB);

module.exports = {
  create: (data) => RejectedParticipant.create(data),
  find: (query) => RejectedParticipant.find(query),
};
