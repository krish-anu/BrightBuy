const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role?.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      console.log(`Role middleware reject: requester=${req.user.id} role=${req.user.role} method=${req.method} path=${req.originalUrl} Allowed roles:`, allowedRoles);
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
};
module.exports = authorizeRoles; 