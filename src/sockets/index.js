const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { socketAuthMiddleware } = require('./socketAuth.middleware');
const { registerChatSocketHandlers } = require('./chat.socket');
const { CLIENT_ORIGIN } = require('../config/env');
let io;

const getCorsOrigin = () => {
  const raw = CLIENT_ORIGIN;
  if (!raw) {
    return true;
  }
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : true;
};

/**
 * Attach Socket.IO to the HTTP server. Connections require a valid JWT (see socketAuth.middleware).
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: getCorsOrigin(),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} user=${socket.user.userId}`);

    socket.emit('connected', {
      userId: socket.user.userId,
      message: 'Socket authenticated'
    });

    registerChatSocketHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} reason=${reason}`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = {
  initSocket,
  getIO
};
