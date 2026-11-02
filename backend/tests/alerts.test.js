const request = require('supertest');
const app = require('../src/server');

describe('Fraud Alerts & Investigation Lifecycle Test Suite', () => {
  let token = '';
  let testAlertId = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@fraudshield.local', password: 'Analyst@123' });
    token = loginRes.body.token;

    // Fetch existing alert
    const alertsRes = await request(app)
      .get('/api/alerts?limit=1')
      .set('Authorization', `Bearer ${token}`);
    
    if (alertsRes.body.data && alertsRes.body.data.length > 0) {
      testAlertId = alertsRes.body.data[0].alertId;
    }
  });

  test('GET /api/alerts should list fraud alerts', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/alerts/:id/notes should append forensic analyst note', async () => {
    const res = await request(app)
      .post(`/api/alerts/${testAlertId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Contacted customer via verified phone. Customer confirmed card theft.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alert.analystNotes.length).toBeGreaterThan(0);
  });

  test('PATCH /api/alerts/:id should resolve alert and synchronize transaction status', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${testAlertId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        investigationStatus: 'Resolved',
        finalDisposition: 'Confirmed Fraud',
        assignedAnalyst: 'Senior Fraud Analyst'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alert.finalDisposition).toBe('Confirmed Fraud');
    expect(res.body.alert.investigationStatus).toBe('Resolved');

    // Verify linked transaction is synchronized
    const txRes = await request(app)
      .get(`/api/transactions/${res.body.alert.transactionId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(txRes.body.transaction.finalStatus).toBe('Confirmed Fraud');
  });
});
