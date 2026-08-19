const express = require('express');
const { protect } = require('../middleware/auth');
const requestController = require('../controllers/requestController');

const router = express.Router();

router.use(protect);

// POST /api/requests        — create a new request (worker applies or shop invites)
// GET  /api/requests        — get inbox/outbox (?type=inbox|outbox|all)
router
  .route('/')
  .post(requestController.createRequest)
  .get(requestController.getRequests);

// PATCH /api/requests/:id/respond  — accept or reject a pending request
router
  .route('/:id/respond')
  .patch(requestController.respondToRequest);

// PATCH /api/requests/:id/cancel   — cancel a pending request (initiator only)
router
  .route('/:id/cancel')
  .patch(requestController.cancelRequest);

module.exports = router;
