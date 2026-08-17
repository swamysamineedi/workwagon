/**
 * asyncHandler
 *
 * Wraps async route handlers to avoid repetitive try/catch blocks.
 * Passes any thrown error to Express's next() for errorHandler to process.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     const data = await SomeService.doSomething();
 *     res.json({ status: 'ok', data });
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
