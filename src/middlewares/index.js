const { authenticate } = require('./auth.middleware');
const errorHandler = require('./error.middleware');
const hppProtection = require('./hpp.middleware');
const requestLogger = require('./requestLogging.middleware');
const rateLimiter = require('./rateLimiter.middleware');
const {
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  uploadBusinessOwnerSettingsFiles
} = require('./upload.middleware');
const validate = require('./validate');
const adminAuth = require('./adminAuth.middleware');

module.exports = {
  authenticate,
  errorHandler,
  hppProtection,
  requestLogger,
  rateLimiter,
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  uploadBusinessOwnerSettingsFiles,
  validate,
  adminAuth
};
