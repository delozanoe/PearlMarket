const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const { scoreTransaction } = require('../services/scoringEngine');
const validateTransaction = require('../middleware/validateTransaction');
const { NotFoundError } = require('../utils/errors');

// POST /api/transactions
router.post('/', validateTransaction, (req, res, next) => {
  try {
    const scoring = scoreTransaction(req.body, req.db);
    const data = {
      ...req.body,
      ...scoring,
    };
    const transaction = Transaction.create(req.db, data);
    console.log(`[Transaction] Created ${transaction.id} | score: ${transaction.fraud_score} | risk: ${transaction.risk_level}`);
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions
router.get('/', (req, res, next) => {
  try {
    const filters = {
      risk_level: req.query.risk_level,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
    };
    const result = Transaction.findAll(req.db, filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:id
router.get('/:id', (req, res, next) => {
  try {
    const transaction = Transaction.findById(req.db, req.params.id);
    if (!transaction) {
      throw new NotFoundError(`Transaction ${req.params.id} not found`);
    }
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transactions/:id/status
router.patch('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['APPROVED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({
        error: 'status must be APPROVED or BLOCKED',
      });
    }
    const transaction = Transaction.updateStatus(req.db, req.params.id, status);
    console.log(`[Transaction] ${req.params.id} status changed to ${status}`);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
