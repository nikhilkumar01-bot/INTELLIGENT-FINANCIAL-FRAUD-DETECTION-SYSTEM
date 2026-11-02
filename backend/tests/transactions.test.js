const request = require('supertest');
const app = require('../src/server');

describe('Transaction Surveillance & Risk Scoring Test Suite', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@fraudshield.local', password: 'Analyst@123' });
    token = res.body.token;
  });

  test('GET /api/transactions should retrieve paginated transactions list', async () => {
    const res = await request(app)
      .get('/api/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test('POST /api/transactions/analyze should score genuine purchase as low risk', async () => {
    const res = await request(app)
      .post('/api/transactions/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: 'CUST-1002',
        amount: 25.00,
        channel: 'CARD',
        merchant: 'Corner Grocery Store',
        txHour: 13,
        txVelocity1h: 1,
        isNewDevice: 0,
        isNewLocation: 0
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.assessment.riskScore).toBeLessThan(35);
    expect(res.body.transaction.finalStatus).toBe('Genuine');
  });

  test('POST /api/transactions/analyze should flag suspicious midnight transfer and auto-generate fraud alert', async () => {
    const res = await request(app)
      .post('/api/transactions/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: 'CUST-1005',
        amount: 19500.00,
        channel: 'WIRE_TRANSFER',
        merchant: 'Offshore Escrow Ltd',
        txHour: 3,
        txVelocity1h: 5,
        isNewDevice: 1,
        isNewLocation: 1
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(res.body.alert).toBeDefined();
    expect(res.body.alert.alertId).toBeDefined();
  });

  test('GET /api/transactions/export should stream CSV content', async () => {
    const res = await request(app)
      .get('/api/transactions/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Transaction ID,Customer ID,Amount');
  });
});
