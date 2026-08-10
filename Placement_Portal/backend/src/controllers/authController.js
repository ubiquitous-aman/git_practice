/**
 * src/controllers/authController.js
 *
 * HTTP Request handlers for authentication.
 */

'use strict';

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const { user, token } = await authService.registerStudent({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      data: {
        user,
        token,
      },
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });
}

module.exports = new AuthController();
