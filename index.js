const app = require('./src/app');
const { PORT } = require('./src/config/env');
// Increase the thread pool size
process.env.UV_THREADPOOL_SIZE = 128;

// UncaughtException Error
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`Server started successfully! on http://localhost:${PORT}`);
});

// UnhandledRejection Error
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
