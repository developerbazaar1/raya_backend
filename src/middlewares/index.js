const errorHandler = require('./error.middleware');
const hppProtection = require('./hpp.middleware');
const rateLimiter = require('./rateLimiter.middleware');
const validate = require('./validate');

module.exports = { errorHandler, hppProtection, rateLimiter, validate };
