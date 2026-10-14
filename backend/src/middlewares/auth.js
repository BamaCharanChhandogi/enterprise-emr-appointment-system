const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Missing Bearer token.', 401);
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      throw new AppError('The user belonging to this token no longer exists or is deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token', 401));
    }
    next(err);
  }
};

/**
 * RBAC Authorization Middleware
 * e.g., authorize('SUPER_ADMIN', 'RECEPTIONIST')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(`Forbidden: Access denied for role '${req.user.role}'`, 403));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
