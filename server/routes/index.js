const express = require('express');
const router = express.Router();

/**
 * API Route Registry
 *
 * All API groups are mounted here and imported into server.js as a single router.
 * This keeps server.js clean and makes the API surface easy to audit at a glance.
 *
 * Current status per phase:
 *  Phase 2: /health implemented
 *  Phase 3: /auth will be added
 *  Phase 4+: remaining routes will be added as each phase completes
 *
 * ROUTE GROUPS (to be mounted in later phases):
 *   /api/auth          — Registration, login, logout, token refresh
 *   /api/workers       — Worker profile CRUD, discovery
 *   /api/shops         — Shop profile CRUD, discovery
 *   /api/vacancies     — Vacancy CRUD, slot management
 *   /api/requests      — Request lifecycle, mutual-match detection
 *   /api/connections   — Active connections, connection management
 *   /api/notifications — User notification inbox
 *   /api/admin         — Platform management (admin only)
 */

// ── Phase 2: Health check ─────────────────────────────────────────────────────
router.use('/health', require('./health'));

// ── Phase 3+ routes (uncomment as phases are completed) ──────────────────────
// router.use('/auth',          require('./auth'));
// router.use('/workers',       require('./workers'));
// router.use('/shops',         require('./shops'));
// router.use('/vacancies',     require('./vacancies'));
// router.use('/requests',      require('./requests'));
// router.use('/connections',   require('./connections'));
// router.use('/notifications', require('./notifications'));
// router.use('/admin',         require('./admin'));

module.exports = router;
