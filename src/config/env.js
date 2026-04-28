require('dotenv').config();
module.exports = {
  PORT: process.env.PORT || 8080,
  // REDIS DATABASE credentials
  REDIS_DB_PASSWORD: process.env.REDIS_DB_PASSWORD,
  // DATABASE credentials
  MONGO_URI: process.env.MONGO_URI,
  // JWT secret key
  JWT_SECRET: process.env.JWT_SECRET,
  BASE_URL: process.env.BASE_URL,

  // DIGITAL OCEAN S3 CREDENTIALS
  DO_SPACES_KEY: process.env.DO_SPACES_KEY,
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
};
