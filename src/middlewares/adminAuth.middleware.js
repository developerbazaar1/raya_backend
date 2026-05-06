const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const AppError = require('../utils/appError');
const AdminUser = require('../models/admin/adminUser.model');

const adminAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if admin user still exists
    // (Supporting both userId and id depending on token structure)
    const currentUser = await AdminUser.findById(decoded.userId || decoded.id);

    if (!currentUser) {
      return next(new AppError('The admin belonging to this token does no longer exist.', 401));
    }

    if (currentUser.status !== 'active') {
      return next(new AppError('Your account is not active.', 403));
    }

    // Grant access to protected route
    req.admin = currentUser;
    req.user = currentUser; // Also setting req.user for compatibility with generic middlewares if needed
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    next(error);
  }
};

module.exports = adminAuth;
