const errorHandler = require('./error.middleware');
const hppProtection = require('./hpp.middleware');
const rateLimiter = require('./rateLimiter.middleware');
const { uploadBusinessOwnerStep8Files } = require('./upload.middleware');
const validate = require('./validate');

module.exports = {
  errorHandler,
  hppProtection,
  rateLimiter,
  uploadBusinessOwnerStep8Files,
  validate
};
