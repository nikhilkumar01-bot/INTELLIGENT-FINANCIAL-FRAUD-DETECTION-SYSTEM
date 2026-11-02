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

  test('POST /api/auth/register should create a new analyst user successfully', async () => {
    const uniqueEmail = `analyst_${Date.now()}@fraudshield.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Analyst',
        email: uniqueEmail,
        password: 'Password@123',
        role: 'analyst'
      });

    expect(res.statusCode).toBe(201);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('analyst');
    expect(res.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(res.body.user.name).toBe('Jane Analyst');

    // Test that the newly registered user can log in immediately
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: 'Password@123' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.role).toBe('analyst');
  });

  test('POST /api/auth/register should create a new admin user and correctly persist the admin role', async () => {
    const uniqueEmail = `admin_${Date.now()}@fraudshield.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Commander',
        email: uniqueEmail,
        password: 'AdminPassword@123',
        role: 'admin'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');

    // Verify token grants admin access to /api/users
    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(usersRes.statusCode).toBe(200);
    expect(usersRes.body.success).toBe(true);
  });

  test('POST /api/auth/register should reject duplicate email with 400 JSON', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Admin',
        email: 'admin@fraudshield.local',
        password: 'Password@123',
        role: 'analyst'
      });

    expect(res.statusCode).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('POST /api/auth/register should reject invalid inputs with 400 JSON', async () => {
    // Missing password
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Pass', email: 'nopass@test.local' });
    expect(res1.statusCode).toBe(400);
    expect(res1.body.success).toBe(false);

    // Short password (< 6 chars)
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short Pass', email: 'short@test.local', password: '123' });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.success).toBe(false);

    // Malformed email
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'ValidPass123!' });
    expect(res3.statusCode).toBe(400);
    expect(res3.body.success).toBe(false);
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
