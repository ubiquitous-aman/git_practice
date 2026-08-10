/**
 * src/controllers/studentController.js
 *
 * HTTP handlers for student APIs.
 */

'use strict';

const studentService = require('../services/studentService');
const asyncHandler = require('../utils/asyncHandler');

class StudentController {
  getProfile = asyncHandler(async (req, res) => {
    const profile = await studentService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const profile = await studentService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: { profile },
    });
  });
}

module.exports = new StudentController();
