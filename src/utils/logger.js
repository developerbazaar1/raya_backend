const { createLogger, format, transports } = require('winston');

const DEFAULT_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

const normalizeMeta = (meta) => {
  if (!meta) {
    return undefined;
  }

  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack
    };
  }

  return meta;
};

const logger = createLogger({
  level: DEFAULT_LEVEL,
  format:
    process.env.NODE_ENV === 'development'
      ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, meta }) => {
          const serializedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${serializedMeta}`;
        })
      )
      : format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [new transports.Console()]
});

module.exports = {
  error: (message, meta) => logger.error(message, { meta: normalizeMeta(meta) }),
  warn: (message, meta) => logger.warn(message, { meta: normalizeMeta(meta) }),
  info: (message, meta) => logger.info(message, { meta: normalizeMeta(meta) }),
  debug: (message, meta) => logger.debug(message, { meta: normalizeMeta(meta) })
};
