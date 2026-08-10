/**
 * src/validators/companyValidator.js
 *
 * Validation rules for company CRUD endpoints.
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

const companyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('description')
    .optional()
    .trim(),
  validate,
];

const companyIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
  validate,
];

module.exports = {
  companyValidation,
  companyIdValidation,
};
