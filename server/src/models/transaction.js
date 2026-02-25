const crypto = require('crypto');
const { NotFoundError, ConflictError } = require('../utils/errors');

function create(db, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, amount, currency, customer_email,
      billing_country, shipping_country, ip_country, ip_address,
      card_bin, card_last4, product_category, account_age_days,
      fraud_score, risk_level, score_breakdown, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, data.amount, data.currency, data.customer_email,
    data.billing_country, data.shipping_country, data.ip_country, data.ip_address || null,
    data.card_bin, data.card_last4, data.product_category, data.account_age_days,
    data.fraud_score, data.risk_level, JSON.stringify(data.score_breakdown), 'PENDING',
    now, now
  );

  return findById(db, id);
}

function findById(db, id) {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!row) return null;

  return {
    ...row,
    score_breakdown: row.score_breakdown ? JSON.parse(row.score_breakdown) : [],
  };
}

function findAll(db, filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.risk_level) {
    conditions.push('risk_level = ?');
    params.push(filters.risk_level);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.from) {
    conditions.push('created_at >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    conditions.push('created_at <= ?');
    params.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(filters.limit || 50, 200);
  const offset = filters.offset || 0;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM transactions ${where}`).get(...params);
  const rows = db.prepare(
    `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  return {
    transactions: rows.map((row) => ({
      ...row,
      score_breakdown: row.score_breakdown ? JSON.parse(row.score_breakdown) : [],
    })),
    total: countRow.total,
    limit,
    offset,
  };
}

function updateStatus(db, id, newStatus) {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!row) {
    throw new NotFoundError(`Transaction ${id} not found`);
  }

  if (row.status !== 'PENDING') {
    throw new ConflictError(`Transaction ${id} is already ${row.status}`);
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE transactions SET status = ?, updated_at = ? WHERE id = ?')
    .run(newStatus, now, id);

  return findById(db, id);
}

function getStats(db) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_transactions,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending,
      COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) as approved,
      COALESCE(SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END), 0) as blocked,
      COALESCE(AVG(fraud_score), 0) as avg_fraud_score,
      COALESCE(SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END), 0) as high_risk_count,
      COALESCE(SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END), 0) as medium_risk_count,
      COALESCE(SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END), 0) as low_risk_count
    FROM transactions
  `).get();

  return {
    ...stats,
    avg_fraud_score: Math.round(stats.avg_fraud_score * 100) / 100,
  };
}

module.exports = { create, findById, findAll, updateStatus, getStats };
