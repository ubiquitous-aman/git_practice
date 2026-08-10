/**
 * src/repositories/driveRepository.js
 *
 * Database access layer for placement_drives and drive_branches.
 */

'use strict';

const db = require('../config/database');

class DriveRepository {
  /**
   * Find all drives with joined company name and array of eligible branches.
   */
  async findAll() {
    const { rows } = await db.query(
      `SELECT d.id, d.company_id, c.name AS company_name, c.website AS company_website,
              d.job_role, d.job_description, d.package_lpa, d.location,
              d.minimum_cgpa, d.maximum_backlogs, d.graduation_year,
              d.application_deadline, d.created_at, d.updated_at,
              COALESCE(
                ARRAY_AGG(b.branch) FILTER (WHERE b.branch IS NOT NULL),
                '{}'
              ) AS eligible_branches
       FROM placement_drives d
       JOIN companies c ON d.company_id = c.id
       LEFT JOIN drive_branches b ON d.id = b.drive_id
       GROUP BY d.id, c.name, c.website
       ORDER BY d.created_at DESC`
    );
    return rows;
  }

  /**
   * Find single drive by ID with branches array.
   */
  async findById(id) {
    const { rows } = await db.query(
      `SELECT d.id, d.company_id, c.name AS company_name, c.website AS company_website,
              d.job_role, d.job_description, d.package_lpa, d.location,
              d.minimum_cgpa, d.maximum_backlogs, d.graduation_year,
              d.application_deadline, d.created_at, d.updated_at,
              COALESCE(
                ARRAY_AGG(b.branch) FILTER (WHERE b.branch IS NOT NULL),
                '{}'
              ) AS eligible_branches
       FROM placement_drives d
       JOIN companies c ON d.company_id = c.id
       LEFT JOIN drive_branches b ON d.id = b.drive_id
       WHERE d.id = $1
       GROUP BY d.id, c.name, c.website`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new drive and its eligible branches atomically inside a transaction.
   */
  async create(driveData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const {
        company_id, job_role, job_description, package_lpa, location,
        minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, eligible_branches
      } = driveData;

      // 1. Insert drive
      const driveResult = await client.query(
        `INSERT INTO placement_drives (
           company_id, job_role, job_description, package_lpa, location,
           minimum_cgpa, maximum_backlogs, graduation_year, application_deadline
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, company_id, job_role, job_description, package_lpa, location,
                   minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, created_at, updated_at`,
        [
          company_id, job_role, job_description || null, package_lpa || null, location || null,
          minimum_cgpa, maximum_backlogs, graduation_year, application_deadline
        ]
      );
      const newDrive = driveResult.rows[0];

      // 2. Insert branches
      for (const branch of eligible_branches) {
        await client.query(
          'INSERT INTO drive_branches (drive_id, branch) VALUES ($1, $2)',
          [newDrive.id, branch.toUpperCase().trim()]
        );
      }

      await client.query('COMMIT');
      newDrive.eligible_branches = eligible_branches.map((b) => b.toUpperCase().trim());
      return newDrive;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update drive details and branches atomically.
   */
  async update(id, driveData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const {
        company_id, job_role, job_description, package_lpa, location,
        minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, eligible_branches
      } = driveData;

      // 1. Update drive
      const driveResult = await client.query(
        `UPDATE placement_drives
         SET company_id = $1, job_role = $2, job_description = $3, package_lpa = $4,
             location = $5, minimum_cgpa = $6, maximum_backlogs = $7,
             graduation_year = $8, application_deadline = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING id, company_id, job_role, job_description, package_lpa, location,
                   minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, created_at, updated_at`,
        [
          company_id, job_role, job_description || null, package_lpa || null, location || null,
          minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, id
        ]
      );

      if (driveResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // 2. Replace branches: delete old branches and insert new ones
      await client.query('DELETE FROM drive_branches WHERE drive_id = $1', [id]);

      for (const branch of eligible_branches) {
        await client.query(
          'INSERT INTO drive_branches (drive_id, branch) VALUES ($1, $2)',
          [id, branch.toUpperCase().trim()]
        );
      }

      await client.query('COMMIT');
      const updatedDrive = driveResult.rows[0];
      updatedDrive.eligible_branches = eligible_branches.map((b) => b.toUpperCase().trim());
      return updatedDrive;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    const { rows } = await db.query(
      'DELETE FROM placement_drives WHERE id = $1 RETURNING id',
      [id]
    );
    return rows.length > 0;
  }
}

module.exports = new DriveRepository();
