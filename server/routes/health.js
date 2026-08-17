const express = require('express');
const router = express.Router();

/**
 * /api/health
 * Health-check endpoint — the only implemented route in Phase 2.
 * Always returns 200 if the server is running.
 * In Phase 3+, this can be extended to check DB connectivity.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Work Wagon backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    db: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

module.exports = router;
