const { permissions } = require("../config/permissions");
const { sendError } = require("../utils/errors");

class RBACMiddleware {
  static async #executeRule(rule, req) {
    if (typeof rule === "string") {
      rule = [rule];
    }
    const [action, validator] = rule;

    const { user } = req;
    console.log("RBAC user:", user); // Debug log for user info
    const role = user?.role || "guest";
    console.log("RBAC role:", role); // Debug log for role
    console.log("RBAC permissions:", permissions[role]); // Debug log for permissions
    const permissionGranted = permissions[role].includes(action);

    if (!permissionGranted) return false;

    if (validator instanceof Function) {
      return await validator(req);
    }

    return true;
  }
  /**
   * Middleware to check if the user has permission to perform an action
   * and optionally validate the request
   *
   * Note: All rules are ORed together i.e. if any rule is satisfied, the user is granted permission
   *
   * @param {Array<[string, (req: Request) => Promise<boolean>] | string>} rules
   * @returns
   */
  static requirePermissions =
    (...rules) =>
    async (req, res, next) => {
      let isExecuted = false;
      for (const rule of rules) {
        const result = await this.#executeRule(rule, req);
        if (result) {
          isExecuted = true;
          next();
        }
      }

      if (!isExecuted) {
        return sendError(
          res,
          403,
          "You do not have permission to perform this action"
        );
      }
    };
}

module.exports = RBACMiddleware;
