const UserRepository = require("../repositories/user");
const OrganisationRepository = require("../repositories/organisation");
const { BadRequestError } = require("../utils/errors");
const { hashPassword } = require("../utils/password");
const { validateEmail } = require("../utils/validations");

class UserService {
  static #checkRequiredFields(user, except = []) {
    const requiredFields = [
      "name",
      "email",
      "password",
      "gender",
      "college",
      "zipCode",
      "degree",
      "yearOfGraduation",
      "image",
      "mobile",
    ];
    const missingFields = requiredFields.filter(
      (field) => !user[field] && !except.includes(field)
    );
    if (missingFields.length) {
      throw new BadRequestError(`Missing ${missingFields.join(", ")}`);
    }
  }

  static async #checkEmailAlreadyExists(email) {
    const user = await UserRepository.getByEmail(email);
    if (user) {
      throw new BadRequestError("User already exists");
    }
  }

  static async #checkValidOrganisation(organisationId) {
    if (!organisationId) return;
    const organisation = await OrganisationRepository.getById(organisationId);
    if (!organisation) {
      throw new BadRequestError("Invalid organisation");
    }
  }

  static async getAll({ limit = 10, page = 1, search = "" }) {
    try {
      return (
        await UserRepository.getAll({
          limit,
          page,
          search,
        })
      ).map((user) => {
        return UserRepository.excludeSensitiveFields(user);
      });
    } catch (err) {
      throw err;
    }
  }

  static async getTotalCount({ search = "" }) {
    try {
      return await UserRepository.getTotalCount({ search });
    } catch (err) {
      throw err;
    }
  }

  static async getById(id) {
    try {
      const user = await UserRepository.getById(id);
      if (!user) {
        throw new BadRequestError("Invalid user");
      }
      return UserRepository.excludeSensitiveFields(user);
    } catch (err) {
      throw err;
    }
  }

  static async create(user) {
    try {
      this.#checkRequiredFields(user);
      if (!validateEmail(user.email)) {
        throw new BadRequestError("Invalid email");
      }
      if (user.password.length < 8) {
        throw new BadRequestError(
          "Password must be at least 8 characters long"
        );
      }
      await this.#checkEmailAlreadyExists(user.email);
      await this.#checkValidOrganisation(user.organisation);
      const passwordHash = await hashPassword(user.password);
      user.password = undefined;
      user.passwordHash = passwordHash;
      return UserRepository.excludeSensitiveFields(
        await UserRepository.create(user)
      );
    } catch (err) {
      throw err;
    }
  }

  static async update(id, user, config = {}) {
    try {
      // check required fields except password
      this.#checkRequiredFields(user, ["password"]);
      // cannot update email
      const existingUser = await UserRepository.getById(id);
      if (!existingUser) {
        throw new BadRequestError("Invalid user");
      }
      if (existingUser.email !== user.email) {
        throw new BadRequestError("Cannot update email");
      }
      // password can only be updated by the user
      // from the forgot password route
      user.password = undefined;
      // only allow admin to update role and organisation
      if (config.role !== "admin") {
        user.role = existingUser.role;
        user.organisation = existingUser.organisation;
      }
      // Prevent changing image URL after registration
      if (user.image && user.image !== existingUser.image) {
        user.image = existingUser.image;
      }
      await this.#checkValidOrganisation(user.organisation);

      const userPayload = await UserRepository.updateById(id, user);
      if (!userPayload) {
        throw new BadRequestError("Invalid user");
      }
      return UserRepository.excludeSensitiveFields(userPayload);
    } catch (err) {
      throw err;
    }
  }

  static async delete(id) {
    try {
      const user = await UserRepository.deleteById(id);
      if (!user) {
        throw new BadRequestError("Invalid user");
      }
      return UserRepository.excludeSensitiveFields(user);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = UserService;
