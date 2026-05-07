const { loggingService } = require('../modules/logging');

const getLogLevelFromStatus = (statusCode) => {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'info';
};

const getEventTypeFromStatus = (statusCode) => {
  if (statusCode >= 500) {
    return 'request_error';
  }

  if (statusCode >= 400) {
    return 'request_fail';
  }

  return 'request_success';
};

// Get operation type based on HTTP method and status code
const getOperationTag = (httpMethod, statusCode) => {
  if (statusCode >= 400) {
    return null; // Don't tag failed requests
  }

  const method = httpMethod.toUpperCase();
  if (method === 'POST' || method === 'PUT') {
    return 'CREATE';
  }

  if (method === 'PATCH') {
    return 'UPDATE';
  }

  if (method === 'DELETE') {
    return 'DELETE';
  }

  return null;
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode;
    const requestError = res.locals.requestError || null;
    const operationTag = getOperationTag(req.method, statusCode);

    // Build tags array
    const tags = ['http', statusCode >= 400 ? 'failure' : 'success'];
    if (operationTag) {
      tags.push(operationTag);
    }

    loggingService.logApplicationEventSafely({
      level: getLogLevelFromStatus(statusCode),
      module: 'http',
      eventType: getEventTypeFromStatus(statusCode),
      message: requestError?.message || `${req.method} ${req.originalUrl}`,
      correlationId: req.headers['x-correlation-id'] || '',
      requestId: req.headers['x-request-id'] || '',
      actorType: req.user?.role || 'request',
      actorId: req.user?.userId?.toString?.() || '',
      metadata: {
        status: statusCode >= 400 ? 'failed' : 'success',
        requestBody: req.body || {},
        query: req.query || {},
        params: req.params || {},
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        errorName: requestError?.name || '',
        isOperational: requestError?.isOperational || false
      },
      httpMethod: req.method,
      routePath: req.originalUrl,
      statusCode,
      durationMs,
      stack: requestError?.stack || '',
      tags
    });
  });

  next();
};

module.exports = requestLogger;
