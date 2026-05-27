/**
 * Global Environment Configuration Registry
 * ------------------------------------------
 * Parses process env variables and exposes clean typed configuration settings.
 */
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8080,
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_TLS: process.env.REDIS_TLS === 'true',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  BASE_URL: process.env.BASE_URL,
  DO_SPACES_KEY: process.env.DO_SPACES_KEY,
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN
};
