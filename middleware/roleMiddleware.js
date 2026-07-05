export const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();
  };
};

export const authorizePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Admins always have access
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if staff has the specific permission
    if (req.user.role === 'staff' && req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  };
};