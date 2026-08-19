const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(requireRole('admin'));

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboardStats);

// ─── Users & Businesses ──────────────────────────────────────────────────────
router.get('/workers', adminController.getWorkers);
router.get('/businesses', adminController.getBusinesses);
router.patch('/users/:id/status', adminController.updateUserStatus);

// ─── Verifications ───────────────────────────────────────────────────────────
router.get('/verifications', adminController.getPendingVerifications);
router.patch('/businesses/:id/verification', adminController.updateVerificationStatus);

// ─── Vacancies ───────────────────────────────────────────────────────────────
router.get('/vacancies', adminController.getVacancies);
router.patch('/vacancies/:id/moderation', adminController.updateVacancyModeration);

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReportStatus);

module.exports = router;
