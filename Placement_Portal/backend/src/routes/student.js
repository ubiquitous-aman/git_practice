/**
 * src/routes/student.js
 *
 * Student endpoints declaration.
 */

'use strict';

const express = require('express');
const studentController = require('../controllers/studentController');
const { updateProfileValidation } = require('../validators/studentValidator');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All student routes require valid JWT token and 'student' role
router.use(authenticateToken);
router.use(authorizeRoles('student'));

router.get('/profile', studentController.getProfile);
router.put('/profile', updateProfileValidation, studentController.updateProfile);

module.exports = router;
