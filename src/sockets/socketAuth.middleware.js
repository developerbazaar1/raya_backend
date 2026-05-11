const User = require('../models/shared/users.model');
const { verifyAuthToken } = require('../helper/auth.helper');

const parseBearer = (header) => {
  if (!header || typeof header !== 'string') {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
};

/**
 * Socket.IO handshake auth: JWT from auth.token, query.token, or Authorization Bearer.
 * Only active (non-deleted) users may connect.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      parseBearer(socket.handshake.headers?.authorization);

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAuthToken(token);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      return next(new Error('Unauthorized'));
    }

    socket.user = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch {
    next(new Error('Unauthorized'));
  }
};

module.exports = {
  socketAuthMiddleware
};
