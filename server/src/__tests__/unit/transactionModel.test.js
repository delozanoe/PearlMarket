const Transaction = require('../../models/transaction');
const { createTestDb } = require('../helpers/testDb');
const { buildTransaction } = require('../helpers/fixtures');

describe('Transaction model', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  function createSampleTransaction(overrides = {}) {
    const data = {
      ...buildTransaction(overrides),
      fraud_score: 25,
      risk_level: 'LOW',
      score_breakdown: [{ signal: 'test', score: 25, description: 'test', severity: 'low' }],
    };
    return Transaction.create(db, data);
  }

  describe('create', () => {
    test('creates a transaction with UUID', () => {
      const txn = createSampleTransaction();
      expect(txn.id).toMatch(/^[0-9a-f]{8}-/);
    });

    test('sets status to PENDING', () => {
      const txn = createSampleTransaction();
      expect(txn.status).toBe('PENDING');
    });

    test('sets created_at and updated_at', () => {
      const txn = createSampleTransaction();
      expect(txn.created_at).toBeDefined();
      expect(txn.updated_at).toBeDefined();
    });

    test('stores and parses score_breakdown as JSON', () => {
      const txn = createSampleTransaction();
      expect(Array.isArray(txn.score_breakdown)).toBe(true);
      expect(txn.score_breakdown[0].signal).toBe('test');
    });
  });

  describe('findById', () => {
    test('returns transaction by id', () => {
      const created = createSampleTransaction();
      const found = Transaction.findById(db, created.id);
      expect(found.id).toBe(created.id);
    });

    test('returns null for non-existent id', () => {
      const found = Transaction.findById(db, 'non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('returns empty list when no transactions', () => {
      const result = Transaction.findAll(db);
      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('returns all transactions', () => {
      createSampleTransaction();
      createSampleTransaction();
      const result = Transaction.findAll(db);
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('filters by risk_level', () => {
      createSampleTransaction();
      Transaction.create(db, {
        ...buildTransaction(), fraud_score: 80, risk_level: 'HIGH', score_breakdown: [],
      });
      const result = Transaction.findAll(db, { risk_level: 'HIGH' });
      expect(result.transactions).toHaveLength(1);
    });

    test('respects limit and offset', () => {
      for (let i = 0; i < 5; i++) createSampleTransaction();
      const result = Transaction.findAll(db, { limit: 2, offset: 1 });
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    test('caps limit at 200', () => {
      const result = Transaction.findAll(db, { limit: 500 });
      expect(result.limit).toBe(200);
    });

    test('defaults limit to 50', () => {
      const result = Transaction.findAll(db);
      expect(result.limit).toBe(50);
    });
  });

  describe('updateStatus', () => {
    test('updates PENDING to APPROVED', () => {
      const txn = createSampleTransaction();
      const updated = Transaction.updateStatus(db, txn.id, 'APPROVED');
      expect(updated.status).toBe('APPROVED');
    });

    test('updates PENDING to BLOCKED', () => {
      const txn = createSampleTransaction();
      const updated = Transaction.updateStatus(db, txn.id, 'BLOCKED');
      expect(updated.status).toBe('BLOCKED');
    });

    test('throws NotFoundError for missing transaction', () => {
      expect(() => Transaction.updateStatus(db, 'missing', 'APPROVED')).toThrow('not found');
    });

    test('throws ConflictError for non-PENDING transaction', () => {
      const txn = createSampleTransaction();
      Transaction.updateStatus(db, txn.id, 'APPROVED');
      expect(() => Transaction.updateStatus(db, txn.id, 'BLOCKED')).toThrow('already APPROVED');
    });
  });

  describe('getStats', () => {
    test('returns zeros when no transactions', () => {
      const stats = Transaction.getStats(db);
      expect(stats.total_transactions).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.blocked).toBe(0);
      expect(stats.avg_fraud_score).toBe(0);
    });

    test('counts by status', () => {
      const t1 = createSampleTransaction();
      const t2 = createSampleTransaction();
      createSampleTransaction();
      Transaction.updateStatus(db, t1.id, 'APPROVED');
      Transaction.updateStatus(db, t2.id, 'BLOCKED');
      const stats = Transaction.getStats(db);
      expect(stats.total_transactions).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.blocked).toBe(1);
    });

    test('calculates average fraud score', () => {
      Transaction.create(db, {
        ...buildTransaction(), fraud_score: 20, risk_level: 'LOW', score_breakdown: [],
      });
      Transaction.create(db, {
        ...buildTransaction(), fraud_score: 80, risk_level: 'HIGH', score_breakdown: [],
      });
      const stats = Transaction.getStats(db);
      expect(stats.avg_fraud_score).toBe(50);
    });
  });
});
