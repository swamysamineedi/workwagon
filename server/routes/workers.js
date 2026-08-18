const express = require('express');
const router = express.Router();
const { getMe, updateMe, getById, list } = require('../controllers/workerController');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/workers — list (shops discover workers)
router.get('/', protect, requireRole('shop', 'admin'), list);

// GET /api/workers/me — own profile
router.get('/me', protect, requireRole('worker'), getMe);

// PUT /api/workers/me — update own profile
router.put('/me', protect, requireRole('worker'), updateMe);

// GET /api/workers/:id — public profile
router.get('/:id', protect, getById);

module.exports = router;
