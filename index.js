const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const app = require('./src/app');
const { PORT } = require('./src/config/env');
const logger = require('./src/utils/logger');


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

// UnhandledRejection Error
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  server.close(() => {
    process.exit(1);
  });
});
