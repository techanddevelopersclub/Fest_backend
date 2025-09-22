const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");
const ParticipantController = require("../controllers/participant");
const RBACMiddleware = require("../middlewares/rbac");
const ParticipantRepository = require("../repositories/participant");

router.post(
  "/",
  AuthMiddleware.requireLoggedIn,
  AuthMiddleware.requireVerified,
  ParticipantController.register
);
router.get(
  "/me",
  AuthMiddleware.requireLoggedIn,
  AuthMiddleware.requireVerified,
  ParticipantController.getAllParticipationsBySelf
);
router.get(
  "/event/:eventId",
  AuthMiddleware.requireLoggedIn,
  AuthMiddleware.requireVerified,
  ParticipantController.getAllByEventId
);
router.patch(
  "/:participantId/attendance",
  AuthMiddleware.requireLoggedIn,
  AuthMiddleware.requireVerified,
  RBACMiddleware.requirePermissions([
    "participant:attendance",
    async (req) => {
      try {
        const { user } = req;
        if (user.role === "admin") return true;
        const participant = await ParticipantRepository.getById(
          req.params.participantId
        );
        if (!participant || !participant.event) return false;
        return (
          String(participant.event.organisation) === String(user.organisation)
        );
      } catch (e) {
        return false;
      }
    },
  ]),
  ParticipantController.updateAttendance
);

module.exports = router;
