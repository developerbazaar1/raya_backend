/* eslint-disable no-unused-vars */
const AppError = require('../utils/appError');
const { loggingService } = require('../modules/logging');
const logger = require('../utils/logger');

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

const sendErrorDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.isOperational ? err.message : GENERIC_ERROR_MESSAGE,
    stack: err.stack,
    details: err.details || null
  });

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  return res.status(500).json({
    status: 'error',
    message: GENERIC_ERROR_MESSAGE
  });
};

const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  const message = value
    ? `${field} "${value}" already exists.`
    : 'Duplicate value provided.';

  return new AppError(message, 400);
};

const handleFileSizeError = (err) => {
  const field = err.field ? ` for ${err.field}` : '';
  return new AppError(`Uploaded file is too large${field}.`, 413);
};

const handleNetworkError = () => new AppError('Service temporarily unavailable.', 503);

const normalizeError = (err) => {
  if (err.isOperational) {
    return err;
  }

  if (err?.code === 11000) {
    return handleDuplicateFieldsError(err);
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return handleFileSizeError(err);
  }

  if (err?.code === 'ENOTFOUND' || err?.name === 'MongooseServerSelectionError') {
    return handleNetworkError();
  }

  return err;
};

const errorHandler = (err, req, res, next) => {
  const normalizedError = normalizeError(err);
  const statusCode = normalizedError.statusCode || 500;
  const status = normalizedError.status || 'error';

  normalizedError.statusCode = statusCode;
  normalizedError.status = status;
  res.locals.requestError = normalizedError;

  logger.error('Request error', {
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode,
    isOperational: normalizedError.isOperational || false,
    method: req.method,
    path: req.originalUrl,
    stack: err.stack
  });

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(normalizedError, res);
  }

  return sendErrorProd(normalizedError, res);
};

module.exports = errorHandler;
