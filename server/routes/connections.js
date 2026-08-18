const express = require('express');
const { protect } = require('../middleware/auth');
const connectionController = require('../controllers/connectionController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(connectionController.getConnections);

module.exports = router;
