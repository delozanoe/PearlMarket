const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { buildTransaction, buildHighRiskTransaction } = require('../helpers/fixtures');

describe('GET /api/stats', () => {
  let app, db;

  beforeEach(() => {
    ({ app, db } = createTestApp());
  });

  afterEach(() => {
    db.close();
  });

  async function createTransaction(overrides = {}) {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildTransaction(overrides));
    return res.body;
  }

  test('returns zeros when no transactions', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.total_transactions).toBe(0);
    expect(res.body.pending).toBe(0);
    expect(res.body.approved).toBe(0);
    expect(res.body.blocked).toBe(0);
    expect(res.body.avg_fraud_score).toBe(0);
    expect(res.body.high_risk_count).toBe(0);
    expect(res.body.medium_risk_count).toBe(0);
    expect(res.body.low_risk_count).toBe(0);
  });

  test('counts transactions by status', async () => {
    const t1 = await createTransaction();
    const t2 = await createTransaction();
    await createTransaction();

    await request(app)
      .patch(`/api/transactions/${t1.id}/status`)
      .send({ status: 'APPROVED' });
    await request(app)
      .patch(`/api/transactions/${t2.id}/status`)
      .send({ status: 'BLOCKED' });

    const res = await request(app).get('/api/stats');
    expect(res.body.total_transactions).toBe(3);
    expect(res.body.pending).toBe(1);
    expect(res.body.approved).toBe(1);
    expect(res.body.blocked).toBe(1);
  });

  test('counts by risk level', async () => {
    await createTransaction(); // LOW
    await request(app).post('/api/transactions').send(buildHighRiskTransaction()); // HIGH

    const res = await request(app).get('/api/stats');
    expect(res.body.low_risk_count).toBe(1);
    expect(res.body.high_risk_count).toBe(1);
  });

  test('calculates average fraud score', async () => {
    await createTransaction(); // score 0 (LOW)
    await createTransaction(); // score 0 (LOW)

    const res = await request(app).get('/api/stats');
    expect(typeof res.body.avg_fraud_score).toBe('number');
  });
});
