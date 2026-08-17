const express = require('express');
const router = express.Router();

/**
 * API Route Registry — Work Wagon
 *
 * Route groups mounted per phase:
 *  Phase 2: /health
 *  Phase 3: /auth
 *  Phase 4: /workers
 *  Phase 5: /shops
 *  Phase 6: /vacancies
 *  Future:  /requests, /connections, /notifications, /admin
 */

// ── Phase 2 ───────────────────────────────────────────────────────────────────
router.use('/health', require('./health'));

// ── Phase 3 ───────────────────────────────────────────────────────────────────
router.use('/auth', require('./auth'));

// ── Phase 4 ───────────────────────────────────────────────────────────────────
// router.use('/workers', require('./workers'));

// ── Phase 5 ───────────────────────────────────────────────────────────────────
// router.use('/shops', require('./shops'));

// ── Phase 6 ───────────────────────────────────────────────────────────────────
// router.use('/vacancies', require('./vacancies'));

// ── Future ────────────────────────────────────────────────────────────────────
// router.use('/requests',      require('./requests'));
// router.use('/connections',   require('./connections'));
// router.use('/notifications', require('./notifications'));
// router.use('/admin',         require('./admin'));

module.exports = router;
