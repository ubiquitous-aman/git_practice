/**
 * src/routes/auth.js
 *
 * Auth endpoints mapping.
 */

'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
