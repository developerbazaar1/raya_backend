process.env.UV_THREADPOOL_SIZE = 128;
const cors = require('cors');
const express = require('express');
require('./config/db');
const { errorHandler, hppProtection, rateLimiter } = require('./middlewares');

const app = express();
app.use(cors());
app.use(rateLimiter);
app.use(hppProtection);

app.use(express.json({
  limit: '5mb'
}));


app.use(require('./routes'));

app.use(errorHandler);

module.exports = app;
