/**
 * src/validators/driveValidator.js
 *
 * Validation rules for Placement Drive API endpoints.
 */

'use strict';

const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    const appErr = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    appErr.details = errorDetails;
    return next(appErr);
  }
  next();
};

const driveValidation = [
  body('company_id')
    .notEmpty()
    .withMessage('Company ID is required')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  body('job_role')
    .trim()
    .notEmpty()
    .withMessage('Job role is required')
    .isLength({ max: 200 })
    .withMessage('Job role cannot exceed 200 characters'),
  body('job_description').optional().trim(),
  body('package_lpa')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0.01 })
    .withMessage('Package (LPA) must be a positive number'),
  body('location').optional().trim(),
  body('minimum_cgpa')
    .notEmpty()
    .withMessage('Minimum CGPA is required')
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be between 0.00 and 10.00'),
  body('maximum_backlogs')
    .notEmpty()
    .withMessage('Maximum backlogs count is required')
    .isInt({ min: 0 })
    .withMessage('Maximum backlogs cannot be negative'),
  body('graduation_year')
    .notEmpty()
    .withMessage('Graduation year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Graduation year must be between 2000 and 2100'),
  body('application_deadline')
    .notEmpty()
    .withMessage('Application deadline is required')
    .isISO8601()
    .withMessage('Application deadline must be a valid ISO 8601 date string'),
  body('eligible_branches')
    .isArray({ min: 1 })
    .withMessage('At least one eligible branch must be specified in eligible_branches array'),
  body('eligible_branches.*')
    .trim()
    .notEmpty()
    .withMessage('Branch names cannot be empty'),
  validate,
];

const driveIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Drive ID must be a positive integer'),
  validate,
];

module.exports = {
  driveValidation,
  driveIdValidation,
};
