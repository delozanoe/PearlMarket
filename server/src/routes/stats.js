const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');

// GET /api/stats
router.get('/', (req, res, next) => {
  try {
    const stats = Transaction.getStats(req.db);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
