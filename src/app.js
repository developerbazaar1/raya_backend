process.env.UV_THREADPOOL_SIZE = 128;
const cors = require('cors');
const express = require('express');
require('./config/db');
const { errorHandler, hppProtection, requestLogger, rateLimiter } = require('./middlewares');
const initTodoCron = require('./cron/todoCron');

const app = express();

// Initialize Cron Jobs
initTodoCron();

app.use(cors());
app.use(rateLimiter);
app.use(hppProtection);
app.use(requestLogger);

app.use(
  express.json({
    limit: '5mb'
  })
);

app.use(require('./routes'));

app.use(errorHandler);

module.exports = app;
