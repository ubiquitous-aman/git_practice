/**
 * src/middleware/authMiddleware.js
 *
 * Authentication & Authorization middleware.
 * - authenticateToken: validates JWT Bearer token and attaches req.user
 * - authorizeRoles: enforces Role-Based Access Control (RBAC)
 */

'use strict';

const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const db = require('../config/database');

/**
 * Authenticate incoming requests via Bearer JWT token.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing or malformed', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    // Verify user exists and is active in DB
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return next(new AppError('User belonging to this token no longer exists', 401, 'UNAUTHORIZED'));
    }

    const user = rows[0];

    if (!user.is_active) {
      return next(new AppError('Your account has been deactivated. Contact Admin.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Role-Based Access Control (RBAC) Guard.
 * @param {...string} roles - Allowed roles (e.g. 'tpo', 'admin')
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires one of the following roles: [${roles.join(', ')}]`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
