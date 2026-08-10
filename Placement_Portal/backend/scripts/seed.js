/**
 * scripts/seed.js
 *
 * Seed initial administrative accounts (TPO & ADMIN).
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

async function seed() {
  try {
    console.log('[seed] Seeding initial users...');

    const defaultPassword = await hashPassword('AdminPass123!');

    // 1. Create Admin
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('System Admin', 'admin@college.edu', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [defaultPassword]
    );

    // 2. Create TPO
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Placement Officer', 'tpo@college.edu', $1, 'tpo')
       ON CONFLICT (email) DO NOTHING`,
      [defaultPassword]
    );

    console.log('[seed] Seeding completed successfully!');
    console.log('  Admin User: admin@college.edu / AdminPass123!');
    console.log('  TPO User:   tpo@college.edu   / AdminPass123!');
  } catch (err) {
    console.error('[seed] Error seeding database:', err.message);
  } finally {
    await db.pool.end();
  }
}

seed();
