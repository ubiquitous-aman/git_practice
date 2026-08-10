/**
 * src/utils/asyncHandler.js
 *
 * Wraps async route handlers to catch rejected promises automatically.
 *
 * Problem:
 *   In Express, if an async function throws, Express does not catch it.
 *   You must call next(err) manually. Forgetting try/catch in every controller is error-prone.
 *
 * Solution:
 *   asyncHandler wraps any async function. If it rejects, the error is automatically
 *   passed to next(), which triggers the global error handler.
 *
 * Usage:
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await userService.getAll();
 *     res.json({ success: true, data: users });
 *   }));
 *
 * Without asyncHandler you'd need try/catch in every route. With it — clean routes.
 */

'use strict';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
