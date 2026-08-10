/**
 * src/routes/application.js
 *
 * Application & Recruitment Workflow Endpoints.
 */

'use strict';

const express = require('express');
const applicationController = require('../controllers/applicationController');
const { updateStatusValidation, applicationIdValidation } = require('../validators/applicationValidator');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// 1. Student submits application for a drive
router.post(
  '/drives/:id/apply',
  authorizeRoles('student'),
  applicationIdValidation,
  applicationController.applyToDrive
);

// 2. Student views their application history
router.get(
  '/me',
  authorizeRoles('student'),
  applicationController.getMyApplications
);

// 3. TPO/Admin views all applicants for a drive
router.get(
  '/drives/:id/applications',
  authorizeRoles('tpo', 'admin'),
  applicationIdValidation,
  applicationController.getDriveApplications
);

// 4. View single application details
router.get(
  '/:id',
  applicationIdValidation,
  applicationController.getApplicationById
);

// 5. TPO/Admin updates application recruitment status
router.patch(
  '/:id/status',
  authorizeRoles('tpo', 'admin'),
  updateStatusValidation,
  applicationController.updateStatus
);

module.exports = router;
