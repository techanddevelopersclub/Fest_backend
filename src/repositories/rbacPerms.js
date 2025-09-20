const { actions, permissions } = require("../config/permissions");
const { applicationDB } = require("../../database");
const RBACPerms = require("../models/RBACPerms")(applicationDB);
const { BadRequestError } = require("../utils/errors");

class RBACPermsRepository {
  static async getAllActions() {
    return actions;
  }

  static async getAllPermissions() {
    const perms = await RBACPerms.find();
    const permissionsMap = {};
    perms.forEach(perm => {
      permissionsMap[perm.role] = perm.permissions;
    });
    return permissionsMap;
  }

  static async getPermissionsForRole(role) {
    const perms = await RBACPerms.findOne({ role });
    return perms ? perms.permissions : null;
  }

  static async updatePermissionsForRole(role, newPermissions) {
    try {
      const perms = await RBACPerms.findOne({ role });
      if (!perms) throw new BadRequestError("Role not found");

      perms.permissions = newPermissions;
      await perms.save();
    } catch (err) {
      throw err;
    }
  }
}

module.exports = RBACPermsRepository;
