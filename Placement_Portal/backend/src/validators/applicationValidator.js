/**
 * src/validators/applicationValidator.js
 *
 * Validation rules for application endpoints.
 */

'use strict';

const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { VALID_STATUSES } = require('../utils/stateMachine');

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

const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Application ID must be a positive integer'),
  body('status')
    .notEmpty()
    .withMessage('New status is required')
    .toUpperCase()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: [${VALID_STATUSES.join(', ')}]`),
  body('remarks').optional().trim(),
  validate,
];

const applicationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Application ID must be a positive integer'),
  validate,
];

module.exports = {
  updateStatusValidation,
  applicationIdValidation,
};
