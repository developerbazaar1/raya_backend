const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');
const { verifyAuthToken } = require('../helper/auth.helper');

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication is required.', 401));
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User not found.', 401));
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role
    };
    req.authUser = user;
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
};

module.exports = {
  authenticate
};
