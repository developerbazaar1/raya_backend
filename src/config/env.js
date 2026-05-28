require('dotenv').config();
module.exports = {
  PORT: process.env.PORT || 8080,
  // DATABASE credentials
  MONGO_URI: process.env.MONGO_URI,
  // JWT secret key
  JWT_SECRET: process.env.JWT_SECRET,
  BASE_URL: process.env.BASE_URL,

  // Valkey / Redis queue credentials
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_DB_PASSWORD: process.env.REDIS_PASSWORD || process.env.REDIS_DB_PASSWORD,
  REDIS_TLS: process.env.REDIS_TLS,
  REDIS_FAMILY: process.env.REDIS_FAMILY || 4,

  // Training generation
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  NVIDIA_MODEL: process.env.NVIDIA_MODEL || 'qwen/qwen3.5-122b-a10b',
  NVIDIA_INVOKE_URL:
    process.env.NVIDIA_INVOKE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',

  // DIGITAL OCEAN S3 CREDENTIALS
  DO_SPACES_KEY: process.env.DO_SPACES_KEY,
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
  DO_SPACES_REGION: process.env.DO_SPACES_REGION || 'sgp1',
  DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET,
  DO_SPACES_BUCKET_URL: process.env.DO_SPACES_BUCKET_URL,
  DO_SPACES_BUCKET_URL_CDN: process.env.DO_SPACES_BUCKET_URL_CDN,
  DO_SPACES_ROOT_FOLDER: process.env.DO_SPACES_ROOT_FOLDER || 'swann',

  // CORS ORIGIN
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
};
