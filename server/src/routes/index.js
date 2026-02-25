const express = require('express');
const router = express.Router();
const transactionsRouter = require('./transactions');
const statsRouter = require('./stats');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/transactions', transactionsRouter);
router.use('/stats', statsRouter);

module.exports = router;
