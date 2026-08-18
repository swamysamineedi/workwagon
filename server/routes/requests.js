const express = require('express');
const { protect } = require('../middleware/auth');
const requestController = require('../controllers/requestController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(requestController.createRequest)
  .get(requestController.getRequests);

router
  .route('/:id/respond')
  .patch(requestController.respondToRequest);

module.exports = router;
