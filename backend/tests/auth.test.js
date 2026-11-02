const request = require('supertest');
const app = require('../src/server');

describe('Authentication & RBAC Test Suite', () => {
  let adminToken = '';
  let analystToken = '';

  beforeAll(async () => {
    // Login as pre-seeded Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fraudshield.local', password: 'Admin@123' });
    if (adminRes.body && adminRes.body.token) {
      adminToken = adminRes.body.token;
    }

    // Login as pre-seeded Analyst
    const analystRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@fraudshield.local', password: 'Analyst@123' });
    if (analystRes.body && analystRes.body.token) {
      analystToken = analystRes.body.token;
    }
  });

  test('POST /api/auth/login should authenticate valid demo credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fraudshield.local', password: 'Admin@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/auth/login should reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fraudshield.local', password: 'WrongPassword!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me should return current user profile with valid JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('admin@fraudshield.local');
  });

  test('GET /api/auth/me should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('RBAC: Analyst role should be blocked (403) from accessing /api/users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('RBAC: Admin role should be permitted (200) to access /api/users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
