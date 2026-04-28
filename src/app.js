process.env.UV_THREADPOOL_SIZE = 128;
const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares');

const app = express();
app.use(cors());

// 
app.use(express.json({
  limit: '5mb'
}));

app.use(require('./routes'));

app.use(errorHandler);


module.exports = app;