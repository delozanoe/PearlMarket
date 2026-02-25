const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { buildTransaction, buildHighRiskTransaction, buildLowRiskTransaction } = require('../helpers/fixtures');

describe('POST /api/transactions', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  test('creates a transaction and returns 201', async () => {
    const res = await request(app).post('/api/transactions').send(buildTransaction());
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.fraud_score).toBeDefined();
    expect(res.body.risk_level).toBeDefined();
    expect(res.body.score_breakdown).toBeInstanceOf(Array);
  });

  test('scores a low-risk transaction as LOW', async () => {
    const res = await request(app).post('/api/transactions').send(buildLowRiskTransaction());
    expect(res.status).toBe(201);
    expect(res.body.risk_level).toBe('LOW');
  });

  test('scores a high-risk transaction as HIGH', async () => {
    const res = await request(app).post('/api/transactions').send(buildHighRiskTransaction());
    expect(res.status).toBe(201);
    expect(res.body.risk_level).toBe('HIGH');
  });

  test('returns 400 for invalid data', async () => {
    const res = await request(app).post('/api/transactions').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('includes score_breakdown with 7 signals', async () => {
    const res = await request(app).post('/api/transactions').send(buildTransaction());
    expect(res.body.score_breakdown).toHaveLength(7);
  });

  test('auto-approves low-score transactions', async () => {
    // Default auto_approve_below is 20, a low-risk transaction scores 0
    const res = await request(app).post('/api/transactions').send(buildLowRiskTransaction());
    expect(res.body.status).toBe('APPROVED');
  });

  test('auto-blocks high-score transactions', async () => {
    // Default auto_block_above is 80, high-risk scores 85
    const res = await request(app).post('/api/transactions').send(buildHighRiskTransaction());
    expect(res.body.status).toBe('BLOCKED');
  });

  test('leaves medium-score transactions PENDING', async () => {
    // Fashion(5) + 8 days(10) + $501(5) + billing!=IP(15) = 35 MEDIUM
    const res = await request(app).post('/api/transactions').send(buildTransaction({
      product_category: 'Fashion',
      account_age_days: 8,
      amount: 501,
      ip_country: 'RU',
    }));
    expect(res.body.status).toBe('PENDING');
    expect(res.body.fraud_score).toBeGreaterThan(20);
    expect(res.body.fraud_score).toBeLessThan(80);
  });
});

describe('GET /api/transactions', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  test('returns empty list initially', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
  });

  test('returns created transactions', async () => {
    await request(app).post('/api/transactions').send(buildTransaction());
    await request(app).post('/api/transactions').send(buildTransaction());
    const res = await request(app).get('/api/transactions');
    expect(res.body.transactions).toHaveLength(2);
  });

  test('filters by risk_level', async () => {
    await request(app).post('/api/transactions').send(buildTransaction());
    await request(app).post('/api/transactions').send(buildHighRiskTransaction());
    const res = await request(app).get('/api/transactions?risk_level=HIGH');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].risk_level).toBe('HIGH');
  });

  test('respects limit and offset', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/transactions').send(buildTransaction());
    }
    const res = await request(app).get('/api/transactions?limit=2&offset=1');
    expect(res.body.transactions).toHaveLength(2);
    expect(res.body.total).toBe(5);
  });
});

describe('GET /api/transactions/:id', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  test('returns transaction by id', async () => {
    const created = await request(app).post('/api/transactions').send(buildTransaction());
    const res = await request(app).get(`/api/transactions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  test('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/api/transactions/non-existent');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/transactions/:id/status', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  test('approves a pending transaction', async () => {
    // Disable auto-actions to get a PENDING transaction
    await request(app).put('/api/settings').send({ auto_approve_below: 0 });
    const txn = await request(app).post('/api/transactions').send(buildTransaction({
      product_category: 'Fashion', account_age_days: 8, amount: 501, ip_country: 'RU',
    }));
    const res = await request(app)
      .patch(`/api/transactions/${txn.body.id}/status`)
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  test('returns 400 for invalid status', async () => {
    await request(app).put('/api/settings').send({ auto_approve_below: 0 });
    const txn = await request(app).post('/api/transactions').send(buildTransaction({
      product_category: 'Fashion', account_age_days: 8, amount: 501, ip_country: 'RU',
    }));
    const res = await request(app)
      .patch(`/api/transactions/${txn.body.id}/status`)
      .send({ status: 'INVALID' });
    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .patch('/api/transactions/non-existent/status')
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(404);
  });

  test('returns 409 for already-actioned transaction', async () => {
    // Low risk = auto-approved
    const txn = await request(app).post('/api/transactions').send(buildLowRiskTransaction());
    expect(txn.body.status).toBe('APPROVED');
    const res = await request(app)
      .patch(`/api/transactions/${txn.body.id}/status`)
      .send({ status: 'BLOCKED' });
    expect(res.status).toBe(409);
  });
});
