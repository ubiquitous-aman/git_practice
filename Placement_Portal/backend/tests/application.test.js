/**
 * tests/application.test.js
 *
 * Automated tests for Applications & Recruitment Workflow APIs.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');
const { generateToken } = require('../src/utils/jwt');

describe('APPLICATION API (/api/applications)', () => {
  let tpoToken;
  let eligibleStudentToken;
  let ineligibleStudentToken;
  let driveId;

  beforeEach(async () => {
    await db.query('DELETE FROM audit_logs');
    await db.query('DELETE FROM application_rounds');
    await db.query('DELETE FROM applications');
    await db.query('DELETE FROM drive_branches');
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');

    const passHash = await hashPassword('Password123!');

    // 1. TPO User
    const tpoRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('TPO Workflow', 'tpo@workflow.com', $1, 'tpo')
       RETURNING id, email, role`,
      [passHash]
    );
    tpoToken = generateToken(tpoRes.rows[0]);

    // 2. Eligible Student (CSE, 8.5 CGPA, 0 backlogs, 2027)
    const elRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Eligible Student', 'eligible@student.com', $1, 'student')
       RETURNING id, email, role`,
      [passHash]
    );
    eligibleStudentToken = generateToken(elRes.rows[0]);
    await db.query(
      `INSERT INTO student_profiles (user_id, roll_number, branch, cgpa, active_backlogs, graduation_year)
       VALUES ($1, 'EL001', 'CSE', 8.5, 0, 2027)`,
      [elRes.rows[0].id]
    );

    // 3. Ineligible Student (MECH, 6.0 CGPA)
    const inRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Ineligible Student', 'ineligible@student.com', $1, 'student')
       RETURNING id, email, role`,
      [passHash]
    );
    ineligibleStudentToken = generateToken(inRes.rows[0]);
    await db.query(
      `INSERT INTO student_profiles (user_id, roll_number, branch, cgpa, active_backlogs, graduation_year)
       VALUES ($1, 'IN001', 'MECH', 6.0, 0, 2027)`,
      [inRes.rows[0].id]
    );

    // 4. Company & Drive requiring CSE & CGPA >= 7.5
    const compRes = await db.query(
      `INSERT INTO companies (name) VALUES ('Microsoft') RETURNING id`
    );
    const companyId = compRes.rows[0].id;

    const driveRes = await request(app)
      .post('/api/drives')
      .set('Authorization', `Bearer ${tpoToken}`)
      .send({
        company_id: companyId,
        job_role: 'Software Engineer',
        minimum_cgpa: 7.5,
        maximum_backlogs: 0,
        graduation_year: 2027,
        application_deadline: '2099-12-31T23:59:59Z',
        eligible_branches: ['CSE'],
      });

    driveId = driveRes.body.data.drive.id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM audit_logs');
    await db.query('DELETE FROM application_rounds');
    await db.query('DELETE FROM applications');
    await db.query('DELETE FROM drive_branches');
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('POST /api/applications/drives/:id/apply', () => {
    it('should allow eligible student to apply', async () => {
      const res = await request(app)
        .post(`/api/applications/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${eligibleStudentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('APPLIED');
    });

    it('should deny application for ineligible student', async () => {
      const res = await request(app)
        .post(`/api/applications/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${ineligibleStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_ELIGIBLE');
      expect(res.body.error.details).toBeDefined();
    });

    it('should reject duplicate application from same student', async () => {
      // First submission
      await request(app)
        .post(`/api/applications/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${eligibleStudentToken}`);

      // Second submission
      const res = await request(app)
        .post(`/api/applications/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${eligibleStudentToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_APPLIED');
    });
  });

  describe('PATCH /api/applications/:id/status (Workflow State Machine)', () => {
    let applicationId;

    beforeEach(async () => {
      const applyRes = await request(app)
        .post(`/api/applications/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${eligibleStudentToken}`);

      applicationId = applyRes.body.data.application.id;
    });

    it('should allow valid transition APPLIED -> APTITUDE', async () => {
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ status: 'APTITUDE', remarks: 'Cleared online test' });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('APTITUDE');
    });

    it('should reject invalid transition APPLIED -> SELECTED', async () => {
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ status: 'SELECTED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should create audit log entry on status change', async () => {
      await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ status: 'REJECTED', remarks: 'Did not attend round' });

      const auditRes = await db.query(
        'SELECT * FROM audit_logs WHERE entity_id = $1 AND action = $2',
        [applicationId, 'APPLICATION_STATUS_UPDATED']
      );

      expect(auditRes.rows.length).toBe(1);
    });
  });
});
