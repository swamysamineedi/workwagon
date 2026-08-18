const express = require('express');
const router = express.Router();
const {
  create, getMine, browse, getById, update, changeStatus, remove,
} = require('../controllers/vacancyController');
const { protect, requireRole } = require('../middleware/auth');

// POST /api/vacancies — shop creates vacancy
router.post('/', protect, requireRole('shop'), create);

// GET /api/vacancies — browse open vacancies (any authenticated user)
router.get('/', protect, browse);

// GET /api/vacancies/mine — shop's own vacancies
router.get('/mine', protect, requireRole('shop'), getMine);

// GET /api/vacancies/:id — single vacancy detail
router.get('/:id', protect, getById);

// PUT /api/vacancies/:id — shop edits own vacancy
router.put('/:id', protect, requireRole('shop'), update);

// PATCH /api/vacancies/:id/status — shop changes status
router.patch('/:id/status', protect, requireRole('shop'), changeStatus);

// DELETE /api/vacancies/:id — shop deletes own vacancy
router.delete('/:id', protect, requireRole('shop'), remove);

module.exports = router;
