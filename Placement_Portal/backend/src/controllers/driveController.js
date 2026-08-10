/**
 * src/controllers/driveController.js
 *
 * HTTP Handlers for placement drives.
 */

'use strict';

const driveService = require('../services/driveService');
const asyncHandler = require('../utils/asyncHandler');

class DriveController {
  getAllDrives = asyncHandler(async (req, res) => {
    const drives = await driveService.getAllDrives();

    // If a student is requesting, evaluate eligibility for each drive
    let responseData = drives;
    if (req.user && req.user.role === 'student') {
      responseData = await Promise.all(
        drives.map(async (drive) => {
          const eligibility = await driveService.checkEligibility(req.user.id, drive.id);
          return {
            ...drive,
            eligibility: {
              is_eligible: eligibility.is_eligible,
              reasons: eligibility.reasons,
            },
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      count: responseData.length,
      data: { drives: responseData },
    });
  });

  getDriveById = asyncHandler(async (req, res) => {
    const drive = await driveService.getDriveById(req.params.id);
    res.status(200).json({
      success: true,
      data: { drive },
    });
  });

  createDrive = asyncHandler(async (req, res) => {
    const drive = await driveService.createDrive(req.body);
    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      data: { drive },
    });
  });

  updateDrive = asyncHandler(async (req, res) => {
    const drive = await driveService.updateDrive(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Placement drive updated successfully',
      data: { drive },
    });
  });

  deleteDrive = asyncHandler(async (req, res) => {
    await driveService.deleteDrive(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Placement drive deleted successfully',
    });
  });

  checkEligibility = asyncHandler(async (req, res) => {
    const eligibility = await driveService.checkEligibility(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { eligibility },
    });
  });
}

module.exports = new DriveController();
