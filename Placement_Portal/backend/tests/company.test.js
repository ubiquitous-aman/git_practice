/**
 * tests/company.test.js
 *
 * Integration tests for Company Management APIs.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');
const { generateToken } = require('../src/utils/jwt');

describe('COMPANY API (/api/companies)', () => {
  let tpoToken;
  let studentToken;
  let tpoUserId;

  beforeEach(async () => {
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');

    const passHash = await hashPassword('Password123!');

    // Create TPO user directly
    const tpoRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('TPO User', 'tpo@test.com', $1, 'tpo')
       RETURNING id, email, role`,
      [passHash]
    );
    tpoUserId = tpoRes.rows[0].id;
    tpoToken = generateToken(tpoRes.rows[0]);

    // Create Student user directly
    const studentRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Student User', 'student@test.com', $1, 'student')
       RETURNING id, email, role`,
      [passHash]
    );
    studentToken = generateToken(studentRes.rows[0]);
  });

  afterAll(async () => {
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('POST /api/companies', () => {
    it('should allow TPO to create a company', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({
          name: 'Google',
          website: 'https://google.com',
          description: 'Global Tech Leader',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company.name).toBe('Google');
    });

    it('should forbid student from creating a company (403)', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Unauthorized Corp',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject duplicate company name', async () => {
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'Microsoft' });

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'microsoft' }); // Case insensitive duplicate

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_COMPANY_NAME');
    });
  });

  describe('GET /api/companies', () => {
    it('should allow student to list companies', async () => {
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'TCS' });

      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.companies.length).toBe(1);
      expect(res.body.data.companies[0].name).toBe('TCS');
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company details', async () => {
      const createRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'Infosys Old', website: 'https://infosys.com' });

      const companyId = createRes.body.data.company.id;

      const updateRes = await request(app)
        .put(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'Infosys Updated', website: 'https://infosys.com' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.company.name).toBe('Infosys Updated');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete an existing company', async () => {
      const createRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({ name: 'Temporary Co' });

      const companyId = createRes.body.data.company.id;

      const deleteRes = await request(app)
        .delete(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${tpoToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${tpoToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
