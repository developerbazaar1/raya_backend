const IORedis = require('ioredis');
const {
  REDIS_DB_PASSWORD,
  REDIS_FAMILY,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_TLS,
  REDIS_URL,
  REDIS_USERNAME
} = require('./env');

const shouldUseTls = () => REDIS_TLS === 'true' || REDIS_HOST.includes('ondigitalocean.com');

const tlsOptions = () => (shouldUseTls() ? { servername: REDIS_HOST } : undefined);

const attachRedisLogging = (client) => {
  client.on('connect', () => {
    console.log(
      `[redis] connecting host=${REDIS_URL ? 'REDIS_URL' : REDIS_HOST} port=${REDIS_URL ? 'from-url' : REDIS_PORT} tls=${shouldUseTls()} family=${REDIS_FAMILY}`
    );
  });

  client.on('ready', () => {
    console.log('[redis] connection ready');
  });

  client.on('error', (error) => {
    console.error(`[redis] connection error code=${error.code || 'UNKNOWN'} message=${error.message}`);
  });

  client.on('close', () => {
    console.warn('[redis] connection closed');
  });

  return client;
};

const getRedisConnection = () => {
  if (REDIS_URL) {
    return attachRedisLogging(new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 20000,
      family: Number(REDIS_FAMILY),
      tls: REDIS_URL.startsWith('rediss://') ? { servername: REDIS_HOST } : undefined
    }));
  }

  return attachRedisLogging(new IORedis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    username: REDIS_USERNAME,
    password: REDIS_DB_PASSWORD,
    maxRetriesPerRequest: null,
    connectTimeout: 20000,
    family: Number(REDIS_FAMILY),
    tls: tlsOptions()
  }));
};

module.exports = {
  getRedisConnection
};
