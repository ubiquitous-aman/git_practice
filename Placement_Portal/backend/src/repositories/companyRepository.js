/**
 * src/repositories/companyRepository.js
 *
 * Database access layer for companies table.
 */

'use strict';

const db = require('../config/database');

class CompanyRepository {
  async findAll() {
    const { rows } = await db.query(
      `SELECT id, name, website, description, created_at, updated_at
       FROM companies
       ORDER BY name ASC`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await db.query(
      `SELECT id, name, website, description, created_at, updated_at
       FROM companies
       WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByName(name) {
    const { rows } = await db.query(
      `SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1)`,
      [name]
    );
    return rows[0] || null;
  }

  async create({ name, website, description }) {
    const { rows } = await db.query(
      `INSERT INTO companies (name, website, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, website, description, created_at, updated_at`,
      [name, website || null, description || null]
    );
    return rows[0];
  }

  async update(id, { name, website, description }) {
    const { rows } = await db.query(
      `UPDATE companies
       SET name = $1, website = $2, description = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, website, description, created_at, updated_at`,
      [name, website || null, description || null, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rows } = await db.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [id]
    );
    return rows.length > 0;
  }
}

module.exports = new CompanyRepository();
