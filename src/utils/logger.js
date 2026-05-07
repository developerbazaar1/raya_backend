const { createLogger, format, transports } = require('winston');

const DEFAULT_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

const formatMetaValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
};

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

const formatDevelopmentLog = ({ timestamp, level, message, meta }) => {
  const header = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

  if (!meta) {
    return header;
  }

  const detailLines = [];
  const preferredOrder = [
    'message',
    'name',
    'code',
    'statusCode',
    'isOperational',
    'method',
    'path'
  ];

  preferredOrder.forEach((key) => {
    if (meta[key] !== undefined) {
      detailLines.push(`  ${key}: ${formatMetaValue(meta[key])}`);
    }
  });

  Object.keys(meta).forEach((key) => {
    if (preferredOrder.includes(key) || key === 'stack') {
      return;
    }

    detailLines.push(`  ${key}: ${formatMetaValue(meta[key])}`);
  });

  if (meta.stack) {
    detailLines.push('  stack:');
    detailLines.push(
      ...String(meta.stack)
        .split('\n')
        .map((line) => `    ${line}`)
    );
  }

  return [header, ...detailLines].join('\n');
};

const logger = createLogger({
  level: DEFAULT_LEVEL,
  format:
    process.env.NODE_ENV === 'development'
      ? format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.printf(formatDevelopmentLog)
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
