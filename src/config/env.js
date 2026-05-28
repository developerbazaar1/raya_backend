/**
 * Global Environment Configuration Registry
 * ------------------------------------------
 * Parses process env variables and exposes clean typed configuration settings.
 */
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8080,
  // REDIS DATABASE credentials
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB_PASSWORD: process.env.REDIS_DB_PASSWORD,
  REDIS_DB: process.env.REDIS_DB || 0,
  REDIS_TLS: process.env.REDIS_TLS,
  REDIS_FAMILY: process.env.REDIS_FAMILY || 4,
  // DATABASE credentials
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  BASE_URL: process.env.BASE_URL,

  // DIGITAL OCEAN S3 CREDENTIALS
  DO_SPACES_KEY: process.env.DO_SPACES_KEY,
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
  DO_SPACES_REGION: process.env.DO_SPACES_REGION || 'sfo3',
  DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET,
  DO_SPACES_BUCKET_URL: process.env.DO_SPACES_BUCKET_URL,
  DO_SPACES_BUCKET_URL_CDN: process.env.DO_SPACES_BUCKET_URL_CDN,
  DO_SPACES_ROOT_FOLDER: process.env.DO_SPACES_ROOT_FOLDER,

  // CORS ORIGIN
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN
};
