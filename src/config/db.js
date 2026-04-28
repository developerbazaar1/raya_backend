const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('Error connecting to MongoDB', err);
    process.exit(1);
  }
})();


