const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { buildTransaction, buildHighRiskTransaction } = require('../helpers/fixtures');

describe('GET /api/stats', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  test('returns zeros when no transactions', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.total_transactions).toBe(0);
    expect(res.body.pending).toBe(0);
    expect(res.body.approved).toBe(0);
    expect(res.body.blocked).toBe(0);
    expect(res.body.avg_fraud_score).toBe(0);
  });

  test('counts transactions correctly', async () => {
    await request(app).post('/api/transactions').send(buildTransaction()); // auto-approved
    await request(app).post('/api/transactions').send(buildHighRiskTransaction()); // auto-blocked

    const res = await request(app).get('/api/stats');
    expect(res.body.total_transactions).toBe(2);
    expect(res.body.approved).toBe(1);
    expect(res.body.blocked).toBe(1);
  });

  test('counts by risk level', async () => {
    await request(app).post('/api/transactions').send(buildTransaction()); // LOW
    await request(app).post('/api/transactions').send(buildHighRiskTransaction()); // HIGH

    const res = await request(app).get('/api/stats');
    expect(res.body.low_risk_count).toBe(1);
    expect(res.body.high_risk_count).toBe(1);
  });
});
