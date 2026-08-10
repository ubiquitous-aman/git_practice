/**
 * src/repositories/userRepository.js
 *
 * Database operations for User entity.
 */

'use strict';

const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async createUser({ name, email, password_hash, role = 'student' }) {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [name, email, password_hash, role]
    );
    return rows[0];
  }
}

module.exports = new UserRepository();
