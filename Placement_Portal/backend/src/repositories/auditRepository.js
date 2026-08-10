/**
 * src/repositories/auditRepository.js
 *
 * Database operations for audit_logs table.
 */

'use strict';

const db = require('../config/database');

class AuditRepository {
  async log({ user_id, action, entity_type, entity_id, metadata }) {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user_id || null,
        action,
        entity_type || null,
        entity_id || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  }
}

module.exports = new AuditRepository();
