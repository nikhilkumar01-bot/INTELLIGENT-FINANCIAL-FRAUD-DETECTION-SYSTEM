const request = require('supertest');
const vercelApp = require('../../api/index');

describe('Vercel Serverless Function Entry Point (api/index.js)', () => {
  test('GET /api/health should return 200 with JSON status', async () => {
    const res = await request(vercelApp).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.status).toBe('healthy');
    expect(res.body.environment).toBeDefined();
  });

  test('GET /health (without /api prefix) should return 200 with JSON status', async () => {
    const res = await request(vercelApp).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('POST /api/auth/register should create a user through Vercel entrypoint', async () => {
    const email = `vercel_test_${Date.now()}@fraudshield.local`;
    const res = await request(vercelApp)
      .post('/api/auth/register')
      .send({
        name: 'Vercel Test User',
        email,
        password: 'Password@123',
        role: 'analyst'
      });

    expect(res.statusCode).toBe(201);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('analyst');
  });

  test('POST /auth/register (when /api is stripped by rewrite) should route correctly', async () => {
    const email = `stripped_rewrite_${Date.now()}@fraudshield.local`;
    const res = await request(vercelApp)
      .post('/auth/register')
      .send({
        name: 'Stripped Path User',
        email,
        password: 'Password@123',
        role: 'admin'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
  });

  test('Non-existent API route should return 404 with JSON (never HTML)', async () => {
    const res = await request(vercelApp).get('/api/non-existent-endpoint-test');
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
