/**
 * src/utils/password.js
 *
 * Password hashing and verification utilities.
 * Uses bcryptjs to ensure passwords are never stored in plaintext.
 */

'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * @param {string} password - Plaintext password input
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
