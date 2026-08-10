/**
 * src/services/authService.js
 *
 * Business logic for authentication:
 * - Registering new student accounts
 * - Verifying credentials and issuing JWTs
 */

'use strict';

const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Register a new student account.
   */
  async registerStudent({ name, email, password }) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL');
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user with role='student'
    const user = await userRepository.createUser({
      name,
      email,
      password_hash,
      role: 'student',
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Authenticate user credentials and return JWT.
   */
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Generic error message to avoid email enumeration attacks
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Your account has been deactivated by administrator', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password_hash from returned object
    delete user.password_hash;

    return { user, token };
  }

  /**
   * Get authenticated user profile.
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }
}

module.exports = new AuthService();
