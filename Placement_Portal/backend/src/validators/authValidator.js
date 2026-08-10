/**
 * src/validators/authValidator.js
 *
 * Request validation rules for auth endpoints.
 */

'use strict';

const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Middleware to check validation result
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

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
};
