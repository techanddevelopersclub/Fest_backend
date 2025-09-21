const { actions, permissions } = require("../config/permissions");
const { applicationDB } = require("../../database");
const RBACPerms = require("../models/RBACPerms")(applicationDB);
const { BadRequestError } = require("../utils/errors");

class RBACPermsRepository {
  static async getAllActions() {
    return actions;
  }

  static async getAllPermissions() {
    return permissions;
  }

  static async getPermissionsForRole(role) {
    const perms = await RBACPerms.findOne({ role });
    return perms ? perms.permissions : [];
  }

  static async updatePermissionsForRole(role, newPermissions) {
    try {
      let perms = await RBACPerms.findOne({ role });
      
      // If role doesn't exist, create it
      if (!perms) {
        perms = new RBACPerms({
          role: role,
          permissions: newPermissions
        });
      } else {
        perms.permissions = newPermissions;
      }
      
      await perms.save();
    } catch (err) {
      throw err;
    }
  }
}

module.exports = RBACPermsRepository;
