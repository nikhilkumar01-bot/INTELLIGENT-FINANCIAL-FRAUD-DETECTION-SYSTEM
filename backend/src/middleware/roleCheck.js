/**
 * Role-Based Access Control (RBAC) Guard
 * Validates user role against allowed roles.
 */
const authorize = (allowedRoles = ['admin']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden. Role '${req.user.role}' lacks permission for this administrative action.` 
      });
    }

    next();
  };
};

module.exports = { authorize };
