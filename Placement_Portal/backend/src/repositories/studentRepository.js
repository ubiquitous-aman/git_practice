/**
 * src/repositories/studentRepository.js
 *
 * Database operations for student_profiles table.
 */

'use strict';

const db = require('../config/database');

class StudentRepository {
  /**
   * Find profile by user_id
   */
  async findByUserId(userId) {
    const { rows } = await db.query(
      `SELECT sp.id, sp.user_id, sp.roll_number, sp.branch, sp.cgpa,
              sp.active_backlogs, sp.graduation_year, sp.resume_url,
              sp.created_at, sp.updated_at,
              u.name, u.email
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * Find profile by roll_number (to check uniqueness)
   */
  async findByRollNumber(rollNumber) {
    const { rows } = await db.query(
      'SELECT id, user_id, roll_number FROM student_profiles WHERE LOWER(roll_number) = LOWER($1)',
      [rollNumber]
    );
    return rows[0] || null;
  }

  /**
   * Upsert student profile (Insert or Update if user_id conflict exists)
   */
  async upsertProfile(userId, { roll_number, branch, cgpa, active_backlogs, graduation_year, resume_url }) {
    const { rows } = await db.query(
      `INSERT INTO student_profiles (
         user_id, roll_number, branch, cgpa, active_backlogs, graduation_year, resume_url, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         roll_number = EXCLUDED.roll_number,
         branch = EXCLUDED.branch,
         cgpa = EXCLUDED.cgpa,
         active_backlogs = EXCLUDED.active_backlogs,
         graduation_year = EXCLUDED.graduation_year,
         resume_url = EXCLUDED.resume_url,
         updated_at = NOW()
       RETURNING id, user_id, roll_number, branch, cgpa, active_backlogs, graduation_year, resume_url, created_at, updated_at`,
      [userId, roll_number, branch, cgpa, active_backlogs, graduation_year, resume_url || null]
    );
    return rows[0];
  }
}

module.exports = new StudentRepository();
