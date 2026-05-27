/**
 * Centralized Valkey / Redis Broker Configuration
 * -----------------------------------------------
 * Resolves connection options dynamically based on environment settings.
 * Supports credentials-free local Docker execution as well as secure TLS cloud services.
 * 
 * Exports: Object (BullMQ & ioredis connection options)
 */
const env = require('./env');

const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  tls: env.REDIS_TLS ? {} : undefined,
  maxRetriesPerRequest: null
};

module.exports = redisConnectionOptions;
