/**
 * Note: This file is not in use right now
 * Admin Authentication Middleware
 * This middleware verifies the JWT token provided in the Authorization header,
 * checks if the user exists, and ensures that the user has one of the allowed roles.
 * If authentication is successful, it attaches the user information to the request object.
 */

const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');
const { verifyAuthToken } = require('../helper/auth.helper');

const adminAuth = (...allowedRoles) => async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication is required.', 401));
  }

  try {
    const decoded = verifyAuthToken(token);
    const currentUser = await User.findById(decoded.userId || decoded.id);

    if (!currentUser) {
      return next(new AppError('User not found.', 401));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }

    req.admin = currentUser;
    req.user = {
      userId: currentUser._id,
      email: currentUser.email,
      role: currentUser.role
    };
    req.authUser = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token.', 401));
  }
};

module.exports = adminAuth;
