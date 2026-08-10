/**
 * src/repositories/applicationRepository.js
 *
 * Database access layer for applications and application_rounds tables.
 */

'use strict';

const db = require('../config/database');

class ApplicationRepository {
  /**
   * Find application by student (user_id) and drive_id
   */
  async findByStudentAndDrive(studentUserId, driveId) {
    const { rows } = await db.query(
      `SELECT id, student_id, drive_id, status, applied_at, updated_at
       FROM applications
       WHERE student_id = $1 AND drive_id = $2`,
      [studentUserId, driveId]
    );
    return rows[0] || null;
  }

  /**
   * Find detailed application by ID including drive info, company info, student info, and round history.
   */
  async findById(id) {
    const { rows: appRows } = await db.query(
      `SELECT a.id, a.student_id, a.drive_id, a.status, a.applied_at, a.updated_at,
              u.name AS student_name, u.email AS student_email,
              sp.roll_number, sp.branch, sp.cgpa, sp.active_backlogs, sp.graduation_year,
              d.job_role, d.package_lpa, d.location,
              c.name AS company_name, c.website AS company_website
       FROM applications a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN student_profiles sp ON a.student_id = sp.user_id
       JOIN placement_drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRows.length === 0) return null;

    const application = appRows[0];

    // Fetch rounds
    const { rows: roundRows } = await db.query(
      `SELECT id, round_order, round_name, status, notes, updated_at
       FROM application_rounds
       WHERE application_id = $1
       ORDER BY round_order ASC`,
      [id]
    );

    application.rounds = roundRows;
    return application;
  }

  /**
   * Create an application and initialize default recruitment rounds in a transaction.
   */
  async create(studentUserId, driveId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert application
      const appRes = await client.query(
        `INSERT INTO applications (student_id, drive_id, status)
         VALUES ($1, $2, 'APPLIED')
         RETURNING id, student_id, drive_id, status, applied_at, updated_at`,
        [studentUserId, driveId]
      );
      const newApp = appRes.rows[0];

      // 2. Insert standard default recruitment rounds matching schema (round_order, round_name)
      const defaultRounds = [
        { order: 1, name: 'Aptitude Test' },
        { order: 2, name: 'Technical Interview' },
        { order: 3, name: 'HR Interview' },
      ];

      for (const round of defaultRounds) {
        await client.query(
          `INSERT INTO application_rounds (application_id, round_order, round_name, status)
           VALUES ($1, $2, $3, 'PENDING')`,
          [newApp.id, round.order, round.name]
        );
      }

      await client.query('COMMIT');
      return newApp;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Find all applications submitted by a specific student.
   */
  async findByStudent(studentUserId) {
    const { rows } = await db.query(
      `SELECT a.id, a.drive_id, a.status, a.applied_at, a.updated_at,
              d.job_role, d.package_lpa, d.location,
              c.name AS company_name, c.website AS company_website
       FROM applications a
       JOIN placement_drives d ON a.drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentUserId]
    );
    return rows;
  }

  /**
   * Find all applications submitted for a specific placement drive (TPO view).
   */
  async findByDrive(driveId, statusFilter) {
    let query = `
      SELECT a.id, a.student_id, a.status, a.applied_at, a.updated_at,
             u.name AS student_name, u.email AS student_email,
             sp.roll_number, sp.branch, sp.cgpa, sp.active_backlogs, sp.graduation_year
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON a.student_id = sp.user_id
      WHERE a.drive_id = $1
    `;
    const params = [driveId];

    if (statusFilter) {
      query += ` AND a.status = $2`;
      params.push(statusFilter.toUpperCase());
    }

    query += ` ORDER BY a.applied_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Update application status and corresponding round status.
   */
  async updateStatus(id, newStatus, remarks) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const appRes = await client.query(
        `UPDATE applications
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, student_id, drive_id, status, applied_at, updated_at`,
        [newStatus, id]
      );

      const updatedApp = appRes.rows[0];

      // Sync round status matching schema CHECK (status IN ('PENDING', 'PASSED', 'FAILED'))
      if (newStatus === 'APTITUDE') {
        await client.query(
          `UPDATE application_rounds SET status = 'PASSED', notes = $1, updated_at = NOW() WHERE application_id = $2 AND round_order = 1`,
          [remarks || 'Passed Aptitude', id]
        );
      } else if (newStatus === 'TECHNICAL') {
        await client.query(
          `UPDATE application_rounds SET status = 'PASSED', notes = $1, updated_at = NOW() WHERE application_id = $2 AND round_order = 2`,
          [remarks || 'Passed Technical', id]
        );
      } else if (newStatus === 'SELECTED') {
        await client.query(
          `UPDATE application_rounds SET status = 'PASSED', notes = $1, updated_at = NOW() WHERE application_id = $2 AND round_order = 3`,
          [remarks || 'Passed HR & Selected', id]
        );
      } else if (newStatus === 'REJECTED') {
        await client.query(
          `UPDATE application_rounds SET status = 'FAILED', notes = $1, updated_at = NOW() WHERE application_id = $2 AND status = 'PENDING'`,
          [remarks || 'Candidate Rejected', id]
        );
      }

      await client.query('COMMIT');
      return updatedApp;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new ApplicationRepository();
