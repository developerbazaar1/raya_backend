const { authenticate } = require('./auth.middleware');
const errorHandler = require('./error.middleware');
const hppProtection = require('./hpp.middleware');
const rateLimiter = require('./rateLimiter.middleware');
const {
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files
} = require('./upload.middleware');
const validate = require('./validate');

module.exports = {
  authenticate,
  errorHandler,
  hppProtection,
  rateLimiter,
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  validate
};
