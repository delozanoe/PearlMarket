const express = require('express');
const router = express.Router();
const transactionsRouter = require('./transactions');
const statsRouter = require('./stats');
const settingsRouter = require('./settings');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/transactions', transactionsRouter);
router.use('/stats', statsRouter);
router.use('/settings', settingsRouter);

module.exports = router;
