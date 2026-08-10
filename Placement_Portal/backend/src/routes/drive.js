/**
 * src/routes/drive.js
 *
 * Placement Drive endpoints.
 */

'use strict';

const express = require('express');
const driveController = require('../controllers/driveController');
const { driveValidation, driveIdValidation } = require('../validators/driveValidator');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All drive endpoints require authentication
router.use(authenticateToken);

// Read drive list & details (All authenticated users)
router.get('/', driveController.getAllDrives);
router.get('/:id', driveIdValidation, driveController.getDriveById);

// Eligibility evaluation endpoint
router.get('/:id/eligibility', driveIdValidation, driveController.checkEligibility);

// Write endpoints (TPO and Admin only)
router.post(
  '/',
  authorizeRoles('tpo', 'admin'),
  driveValidation,
  driveController.createDrive
);

router.put(
  '/:id',
  authorizeRoles('tpo', 'admin'),
  driveIdValidation,
  driveValidation,
  driveController.updateDrive
);

router.delete(
  '/:id',
  authorizeRoles('tpo', 'admin'),
  driveIdValidation,
  driveController.deleteDrive
);

module.exports = router;
