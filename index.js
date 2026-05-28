const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const app = require('./src/app');
const { PORT } = require('./src/config/env');
const logger = require('./src/utils/logger');
const { initSocket } = require('./src/sockets');

// Increase the thread pool size
process.env.UV_THREADPOOL_SIZE = 128;

// UncaughtException Error
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info(`Server started successfully on http://localhost:${PORT}`);
});

initSocket(server);

if (process.env.TRAINING_WORKER_AUTO_START !== 'false') {
  require('./src/workers/trainingGeneration.worker');
  logger.info('Training generation worker started with API process');
}

// UnhandledRejection Error
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  server.close(() => {
    process.exit(1);
  });
});
