const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');

const registerSchema = {
  email:    [rules.required(), rules.isEmail()],
  password: [rules.required(), rules.minLength(8), rules.maxLength(72)],
  role:     [rules.required(), rules.isEnum(['worker', 'shop'])],
};

const loginSchema = {
  email:    [rules.required(), rules.isEmail()],
  password: [rules.required()],
};

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET  /api/auth/me  — requires valid JWT
router.get('/me', protect, getMe);

module.exports = router;
