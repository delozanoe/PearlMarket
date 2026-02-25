const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { buildTransaction, buildHighRiskTransaction, buildMediumRiskTransaction, buildLowRiskTransaction } = require('../helpers/fixtures');

describe('POST /api/transactions', () => {
  let app, db;

  beforeEach(() => {
    ({ app, db } = createTestApp());
  });

  afterEach(() => {
    db.close();
  });

  test('creates a transaction and returns 201', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildMediumRiskTransaction());

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PENDING');
    expect(res.body.fraud_score).toBeDefined();
    expect(res.body.risk_level).toBeDefined();
    expect(res.body.score_breakdown).toBeInstanceOf(Array);
  });

  test('scores a low-risk transaction as LOW', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildLowRiskTransaction());

    expect(res.status).toBe(201);
    expect(res.body.risk_level).toBe('LOW');
    expect(res.body.fraud_score).toBeLessThanOrEqual(30);
  });

  test('scores a high-risk transaction as HIGH', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildHighRiskTransaction());

    expect(res.status).toBe(201);
    expect(res.body.risk_level).toBe('HIGH');
    expect(res.body.fraud_score).toBeGreaterThanOrEqual(71);
  });

  test('returns 400 for invalid data', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildTransaction({ customer_email: 'not-email' }));

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('customer_email must be a valid email address');
  });

  test('includes score_breakdown with 6 signals', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildTransaction());

    expect(res.body.score_breakdown).toHaveLength(7);
  });
});

describe('GET /api/transactions', () => {
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

  async function createMediumRiskTransaction() {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildMediumRiskTransaction());
    return res.body;
  }

  test('returns empty list initially', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  test('returns created transactions', async () => {
    await createTransaction();
    await createTransaction();

    const res = await request(app).get('/api/transactions');
    expect(res.body.transactions).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test('filters by risk_level', async () => {
    await createTransaction(); // LOW risk (Home Goods, 365 days, $100, all US)
    await request(app).post('/api/transactions').send(buildHighRiskTransaction());

    const res = await request(app).get('/api/transactions?risk_level=HIGH');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].risk_level).toBe('HIGH');
  });

  test('filters by status', async () => {
    // Use medium-risk transactions that stay PENDING (not auto-actioned)
    const txn = await createMediumRiskTransaction();
    await createMediumRiskTransaction();
    await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'APPROVED' });

    const res = await request(app).get('/api/transactions?status=APPROVED');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].status).toBe('APPROVED');
  });

  test('respects limit and offset', async () => {
    for (let i = 0; i < 5; i++) await createTransaction();

    const res = await request(app).get('/api/transactions?limit=2&offset=1');
    expect(res.body.transactions).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.limit).toBe(2);
    expect(res.body.offset).toBe(1);
  });

  test('returns transactions ordered by created_at DESC', async () => {
    const first = await createTransaction();
    const second = await createTransaction();

    const res = await request(app).get('/api/transactions');
    expect(res.body.transactions[0].id).toBe(second.id);
  });
});

describe('GET /api/transactions/:id', () => {
  let app, db;

  beforeEach(() => {
    ({ app, db } = createTestApp());
  });

  afterEach(() => {
    db.close();
  });

  test('returns transaction by id', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .send(buildTransaction());

    const res = await request(app).get(`/api/transactions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.score_breakdown).toBeInstanceOf(Array);
  });

  test('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/api/transactions/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });
});

describe('PATCH /api/transactions/:id/status', () => {
  let app, db;

  beforeEach(() => {
    ({ app, db } = createTestApp());
  });

  afterEach(() => {
    db.close();
  });

  async function createPendingTransaction() {
    const res = await request(app)
      .post('/api/transactions')
      .send(buildMediumRiskTransaction());
    return res.body;
  }

  test('approves a pending transaction', async () => {
    const txn = await createPendingTransaction();
    const res = await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  test('blocks a pending transaction', async () => {
    const txn = await createPendingTransaction();
    const res = await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'BLOCKED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('BLOCKED');
  });

  test('returns 400 for invalid status', async () => {
    const txn = await createPendingTransaction();
    const res = await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('APPROVED or BLOCKED');
  });

  test('returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .patch('/api/transactions/non-existent/status')
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(404);
  });

  test('returns 409 for already-actioned transaction', async () => {
    const txn = await createPendingTransaction();
    await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'APPROVED' });

    const res = await request(app)
      .patch(`/api/transactions/${txn.id}/status`)
      .send({ status: 'BLOCKED' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already APPROVED');
  });
});
