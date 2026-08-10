/**
 * src/routes/company.js
 *
 * Company management endpoints.
 */

'use strict';

const express = require('express');
const companyController = require('../controllers/companyController');
const { companyValidation, companyIdValidation } = require('../validators/companyValidator');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All company routes require authentication
router.use(authenticateToken);

// Read endpoints accessible by all roles
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyIdValidation, companyController.getCompanyById);

// Write endpoints restricted to TPO and ADMIN
router.post(
  '/',
  authorizeRoles('tpo', 'admin'),
  companyValidation,
  companyController.createCompany
);

router.put(
  '/:id',
  authorizeRoles('tpo', 'admin'),
  companyIdValidation,
  companyValidation,
  companyController.updateCompany
);

router.delete(
  '/:id',
  authorizeRoles('tpo', 'admin'),
  companyIdValidation,
  companyController.deleteCompany
);

module.exports = router;
