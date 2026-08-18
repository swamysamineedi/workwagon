const express = require('express');
const router = express.Router();
const { getMe, updateMe, getById } = require('../controllers/shopController');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/shops/me — own shop profile
router.get('/me', protect, requireRole('shop'), getMe);

// PUT /api/shops/me — update own shop profile
router.put('/me', protect, requireRole('shop'), updateMe);

// GET /api/shops/:id — public shop profile
router.get('/:id', protect, getById);

module.exports = router;
