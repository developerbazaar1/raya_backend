const IORedis = require('ioredis');
const {
  REDIS_DB,
  REDIS_DB_PASSWORD,
  REDIS_FAMILY,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_TLS,
  REDIS_URL,
  REDIS_USERNAME
} = require('./env');

const redisPassword = REDIS_DB_PASSWORD || REDIS_PASSWORD;
const redisFamily = Number(REDIS_FAMILY || 4);
const redisPort = Number(REDIS_PORT || 6379);
const redisDb = Number(REDIS_DB || 0);

const shouldUseTls = () => REDIS_TLS === true || REDIS_TLS === 'true' || REDIS_HOST.includes('ondigitalocean.com');

const tlsOptions = () => (shouldUseTls() ? { servername: REDIS_HOST } : undefined);

const redisConnectionOptions = {
  host: REDIS_HOST,
  port: redisPort,
  username: REDIS_USERNAME,
  password: redisPassword,
  db: redisDb,
  maxRetriesPerRequest: null,
  connectTimeout: 20000,
  family: redisFamily,
  tls: tlsOptions()
};

const attachRedisLogging = (client) => {
  client.on('connect', () => {
    console.log(
      `[redis] connecting host=${REDIS_URL ? 'REDIS_URL' : REDIS_HOST} port=${REDIS_URL ? 'from-url' : redisPort} tls=${shouldUseTls()} family=${redisFamily}`
    );
  });

  client.on('ready', () => {
    console.log('[redis] connection ready');
  });

  client.on('error', (error) => {
    console.error(
      `[redis] connection error code=${error.code || 'UNKNOWN'} message=${error.message}`
    );
  });

  client.on('close', () => {
    console.warn('[redis] connection closed');
  });

  return client;
};

const getRedisConnection = () => {
  if (REDIS_URL) {
    return attachRedisLogging(
      new IORedis(REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 20000,
        family: redisFamily,
        tls: REDIS_URL.startsWith('rediss://') ? tlsOptions() : undefined
      })
    );
  }

  return attachRedisLogging(new IORedis(redisConnectionOptions));
};

module.exports = redisConnectionOptions;
module.exports.getRedisConnection = getRedisConnection;
