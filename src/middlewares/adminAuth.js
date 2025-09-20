// Simple hardcoded admin auth middleware
module.exports = (req, res, next) => {
  const { adminId, adminPassword } = req.headers;
  // Change these values as needed
  const VALID_ID = "festifyadmin";
  const VALID_PASSWORD = "festify2025";
  if (adminId === VALID_ID && adminPassword === VALID_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};
