const asyncHandler =
  (fn, { log } = {}) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
      log?.error?.('Error in asyncHandler', err, {
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
      });
      next(err);
    });

module.exports = asyncHandler;
