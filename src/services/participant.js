const EventRepository = require("../repositories/event");
const ParticipantRepository = require("../repositories/participant");
const UserRepository = require("../repositories/user");
const { BadRequestError } = require("../utils/errors");
const PaymentService = require("./payment");
const PromotionCampaignService = require("./promotionCampaign");
const RewardService = require("./rewards");

class ParticipantService {
  static checkRequiredFields(participant) {
    if (!participant) throw new BadRequestError("Missing participant");
    const requiredFields = ["event", "leader"];
    const missingFields = [];
    requiredFields.forEach((field) => {
      if (!participant[field]) missingFields.push(field);
    });
    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing fields: ${missingFields.join(", ")}`);
    }
  }

  static async #checkValidMembers(members) {
    const valid = await UserRepository.checkAllVerified(members);
    if (!valid) {
      throw new BadRequestError("Some members are not verified, or invalid");
    }
  }

  static async #checkExistingParticipation(event, participant) {
    const existingParticipations =
      await ParticipantRepository.getAllByEventAndMembers(
        event._id,
        participant.members
      );
    if (existingParticipations.length > 0) {
      throw new BadRequestError(
        "Some members are already participating in this event"
      );
    }
  }

  static async #checkValidParticipation(event, participant) {
    const date = new Date();
    if (new Date(event.registrationsStart) > date) {
      throw new BadRequestError("Registrations have not started yet");
    } else if (new Date(event.registrationsEnd) < date) {
      throw new BadRequestError("Registrations have ended");
    }
    if (participant.isTeam) {
      if (!participant.teamName) {
        throw new BadRequestError("Team name is required");
      }
      // Use participant.teamSize when available (frontend may have provided team size) else fallback to members length
      const teamSizeToCheck = participant.teamSize && participant.teamSize > 0 ? participant.teamSize : participant.members.length;
      if (event.minTeamSize > teamSizeToCheck) {
        throw new BadRequestError(
          `Team must have at least ${event.minTeamSize} members`
        );
      }
      if (event.maxTeamSize < teamSizeToCheck) {
        throw new BadRequestError(
          `Team can have at most ${event.maxTeamSize} members`
        );
      }
    } else {
      if (participant.members.length > 1) {
        throw new BadRequestError(`Solo event can have at most 1 member`);
      }
    }
  }

  static async create(participant) {
    try {
      this.checkRequiredFields(participant);
      return await ParticipantRepository.create(participant);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Admin-only bulk registration for ad-hoc participants without User accounts.
   * This bypasses payment and promo flows and simply creates participants
   * directly for the specified events.
   *
   * @param {{ basicDetails: { name: string, college?: string, mobile?: string, email?: string, teamName?: string, teamMemberNames?: string[] }, eventIds: string[] }} payload
   */
  static async adminBulkRegister({ basicDetails, eventIds }) {
    try {
      if (!basicDetails || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        throw new BadRequestError("Missing basicDetails or eventIds");
      }

      const { name, college, mobile, email, teamName, teamMemberNames } = basicDetails;
      if (!name) {
        throw new BadRequestError("Leader name is required");
      }

      const cleanTeamMemberNames = Array.isArray(teamMemberNames)
        ? [...new Set(teamMemberNames.map((m) => (m || "").trim()).filter(Boolean))]
        : [];

      // Compute team flags
      const isTeam = !!(teamName || cleanTeamMemberNames.length > 0);
      const teamSize = Math.max(1, cleanTeamMemberNames.length || 1);

      const created = [];
      for (const eventId of eventIds) {
        if (!eventId) continue;
        const event = await EventRepository.getById(eventId);
        if (!event) {
          // Skip invalid events silently
          // eslint-disable-next-line no-continue
          continue;
        }

        const participantDoc = {
          event: event._id,
          leader: null,
          isTeam,
          teamName: isTeam ? teamName || name : undefined,
          teamMemberNames: cleanTeamMemberNames,
          teamSize,
          leaderName: name,
          leaderCollege: college,
          leaderMobile: mobile,
          leaderEmail: email,
        };

        const createdParticipant = await ParticipantRepository.create(participantDoc);
        created.push(createdParticipant);
      }

      if (created.length === 0) {
        throw new BadRequestError("No participants were created (invalid events?)");
      }

      return created;
    } catch (err) {
      throw err;
    }
  }

  static async register(participantData, { promoCode, email }) {
    try {
      console.log("Received participant data:", participantData);
      this.checkRequiredFields(participantData);
      const event = await EventRepository.getById(participantData.event);
      if (!event) throw new BadRequestError("Invalid event");

      if (!event.isRegistrationRequired) {
        throw new BadRequestError(
          "Registrations are not required for this event"
        );
      }

      participantData.members = [
        ...new Set([
          participantData.leader,
          ...(participantData.members || []),
        ]),
      ]; // add leader and remove duplicates

      // Calculate team size - use frontend value if provided, otherwise calculate from members
      if (participantData.teamSize && participantData.teamSize > 0) {
        // Use the team size from frontend (based on team member names)
        console.log("Using frontend team size:", participantData.teamSize);
      } else {
        // Fallback to calculating from members array
        participantData.teamSize = participantData.members.length;
        console.log("Calculated team size from members:", participantData.teamSize);
      }

      console.log("Processed participant data:", participantData);

      // If member user IDs are provided (more than just the leader), validate them
      const providedMemberIds = Array.isArray(participantData.members)
        ? participantData.members.filter(Boolean).filter((id) => id !== participantData.leader)
        : [];

      if (providedMemberIds.length > 0) {
        // Validate user IDs and ensure they're not already participating in the event
        participantData.members = [participantData.leader, ...new Set(providedMemberIds)];
        await this.#checkValidMembers(participantData.members);
        await this.#checkExistingParticipation(event, participantData);
      } else if (Array.isArray(participantData.teamMemberNames) && participantData.teamMemberNames.length > 0) {
        // When member IDs are not available but team member NAMES are given (unregistered members),
        // validate team size constraints and skip user-id based validations
        // teamMemberNames may already include the leader's name (frontend does this), so we compute total
        // size robustly: if leader's name is in teamMemberNames (and available) use that length, else
        // add 1 for the leader.
        let totalSize;
        // Normalize and dedupe names
        const normalizedNames = participantData.teamMemberNames
          .map((n) => (n || "").trim())
          .filter(Boolean);
        const uniqueNames = [...new Set(normalizedNames)];

        try {
          const leaderUser = await UserRepository.getById(participantData.leader);
          const leaderName = leaderUser?.name ? leaderUser.name.trim().toLowerCase() : null;
          const includesLeader = leaderName && uniqueNames.map(n => n.toLowerCase()).includes(leaderName);
          totalSize = includesLeader ? uniqueNames.length : 1 + uniqueNames.length;
        } catch (err) {
          // If leader fetch fails, assume frontend included leader name (safe default), use uniqueNames length
          totalSize = uniqueNames.length;
        }
        // Ensure names array kept in consistent, unique, trimmed format
        participantData.teamMemberNames = uniqueNames;
        if (event.minTeamSize > 1) {
          if (totalSize < event.minTeamSize) {
            throw new BadRequestError(`Team must have at least ${event.minTeamSize} members`);
          }
          if (totalSize > event.maxTeamSize) {
            throw new BadRequestError(`Team can have at most ${event.maxTeamSize} members`);
          }
        } else {
          // Solo event; allow teamMemberNames only if they represent the leader alone.
          if (totalSize !== 1) {
            throw new BadRequestError(`Solo event can have at most 1 member`);
          }
        }
        // Ensure teamSize aligns with provided names. Keep leader-only members array and set teamSize.
        participantData.members = [participantData.leader];
        // Overwrite teamSize by computed totalSize to ensure correctness even if frontend value was inconsistent
        if (participantData.teamSize && participantData.teamSize !== totalSize) {
          console.warn(`ParticipantService.register: provided teamSize (${participantData.teamSize}) does not match computed totalSize (${totalSize}). Overriding.`);
        }
        participantData.teamSize = totalSize;
        // Check leader is not already participating (cannot check unregistered member names)
        await this.#checkExistingParticipation(event, participantData);
      } else {
        // No additional members were given; default members array contains only the leader
        participantData.members = [participantData.leader];
        // still perform existing participation check for leader
        await this.#checkExistingParticipation(event, participantData);
      }

      if (event.minTeamSize > 1) {
        participantData.isTeam = true;
      } else {
        participantData.isTeam = false;
        // Don't override teamName for solo events - let it keep the participant name
      }
      await this.#checkValidParticipation(event, participantData);

      let promotion,
        amountToPay = event.registrationFeesInINR;
      console.log("Amount to pay:", amountToPay);
      if (promoCode) {
        promotion = await PromotionCampaignService.getByCode(promoCode);
        if (!promotion) throw new BadRequestError("Invalid promo code");

        // check user eligibility
        let isEligible = false;
        if (promotion.type === "general") isEligible = true;
        else if (promotion.type === "targeted") {
          const userPatterns = [
            `email:${email}`,
            `domain:${email.split("@")[1]}`,
          ];
          isEligible = promotion.pattern.some((pattern) =>
            userPatterns.some((userPattern) =>
              new RegExp(pattern).test(userPattern)
            )
          );

          if (!isEligible) {
            throw new BadRequestError("User not eligible for this promotion");
          }
        }

        // check applicable on validity
        const validApplicableOn = ["event:*", `event:${event._id.toString()}`];
        let isApplicable = false;
        validApplicableOn.forEach((applicableOn) => {
          if (promotion.applicableOn.includes(applicableOn)) {
            isApplicable = true;
          }
        });
        if (!isApplicable) {
          throw new BadRequestError("Promotion not applicable on this event");
        }

        const discount = await PromotionCampaignService.calculateDiscount(
          promotion,
          event.registrationFeesInINR
        );
        console.log("Discount:", discount);
        amountToPay = event.registrationFeesInINR - discount;
      }

      // everything is fine, its payment time
      if (amountToPay === 0) {
        const participant = await ParticipantRepository.create(participantData);

        // create used reward for the promotion only if there was a promotion
        if (promotion) {
          const reward = {
            user: participant.leader,
            type: "PromotionCampaign",
            reference: promotion._id,
            status: "used",
            usedBy: participant.leader,
          };
          await RewardService.create(reward);
        }

        return {
          participant,
          type: "participant",
        };
      }

      console.log("Amount to pay:", amountToPay);
      const order = await PaymentService.createOrder({
        amountInINR: amountToPay,
        notes: {
          type: "Participant",
          user: participantData.leader,
          participant: JSON.stringify(participantData),
          appliedPromotionId: promotion?._id || null,
        },
      });
      return {
        order,
        type: "order",
      };
    } catch (err) {
      throw err;
    }
  }

  static async getAllParticipationsBySelf(userId) {
    try {
      if (!userId) throw new BadRequestError("Missing userId");
      const participations =
        await ParticipantRepository.getAllParticipationsBySelf(userId);
      return participations;
    } catch (err) {
      throw err;
    }
  }

  static async getAllByUserId(userId) {
    try {
      if (!userId) throw new BadRequestError("Missing userId");
      const participations = await ParticipantRepository.getAllByUserId(userId);
      return participations;
    } catch (err) {
      throw err;
    }
  }

  static async getAllByEventId(eventId) {
    try {
      if (!eventId) throw new BadRequestError("Missing eventId");
      const participations = await ParticipantRepository.getAllByEventId(
        eventId
      );
      return participations;
    } catch (err) {
      throw err;
    }
  }

  static async updateAttendance(participantId, attendance, markedBy) {
    try {
      if (!participantId) throw new BadRequestError("Missing participantId");
      if (!attendance) throw new BadRequestError("Missing attendance status");
      if (!["present", "absent", "pending"].includes(attendance)) {
        throw new BadRequestError("Invalid attendance status");
      }

      const updatedParticipant = await ParticipantRepository.updateById(
        participantId,
        {
          attendance,
          attendanceMarkedAt: new Date(),
          attendanceMarkedBy: markedBy,
        }
      );

      return updatedParticipant;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = ParticipantService;
