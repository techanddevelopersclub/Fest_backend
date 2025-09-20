const RBACService = require("../services/rbac");
const { BadRequestError } = require("../utils/errors");

class RBACController {
  static async getMyPermissions(req, res, next) {
    try {
      const role = req.user?.role || "guest";
      const permissions = await RBACService.getPermissions(role);
      return res.status(200).json({
        permissions,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllActions(req, res, next) {
    try {
      console.log("Getting all actions...");
      const actions = await RBACService.getAllActions();
      console.log("Actions retrieved:", actions);
      return res.status(200).json({
        actions,
      });
    } catch (err) {
      console.error("Error getting actions:", err);
      next(err);
    }
  }

  static async getAllPermissions(req, res, next) {
    try {
      console.log("Getting all permissions...");
      const permissions = await RBACService.getAllPermissions();
      console.log("Permissions retrieved:", permissions);
      return res.status(200).json({
        permissions,
      });
    } catch (err) {
      console.error("Error getting permissions:", err);
      next(err);
    }
  }

  static async updatePermissions(req, res, next) {
    try {
      const { permissionsMap } = req.body;
      console.log("Received permissions map:", permissionsMap);
      
      if (!permissionsMap) {
        throw new BadRequestError("No permissions map in request body");
      }
      
      for (const { role, permissions } of permissionsMap) {
        console.log("Processing role:", role, "with permissions:", permissions);
        await RBACService.updatePermissions(role, permissions);
      }
      
      return res.status(200).json({
        message: "Permissions updated successfully",
      });
    } catch (err) {
      console.error("Error in updatePermissions controller:", err);
      next(err);
    }
  }
}

module.exports = RBACController;
