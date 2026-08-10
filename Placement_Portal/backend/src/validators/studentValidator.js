/**
 * src/validators/studentValidator.js
 *
 * Validation rules for student profile API endpoints.
 */

'use strict';

const { body, validationResult } = require('express-validator');
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

const updateProfileValidation = [
  body('roll_number')
    .trim()
    .notEmpty()
    .withMessage('Roll number is required')
    .isLength({ max: 50 })
    .withMessage('Roll number cannot exceed 50 characters'),
  body('branch')
    .trim()
    .notEmpty()
    .withMessage('Branch is required')
    .isLength({ max: 100 })
    .withMessage('Branch name cannot exceed 100 characters'),
  body('cgpa')
    .notEmpty()
    .withMessage('CGPA is required')
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('CGPA must be a decimal number between 0.00 and 10.00'),
  body('active_backlogs')
    .notEmpty()
    .withMessage('Active backlogs count is required')
    .isInt({ min: 0 })
    .withMessage('Active backlogs cannot be negative'),
  body('graduation_year')
    .notEmpty()
    .withMessage('Graduation year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Graduation year must be between 2000 and 2100'),
  body('resume_url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Resume URL must be a valid URL string'),
  validate,
];

module.exports = {
  updateProfileValidation,
};
