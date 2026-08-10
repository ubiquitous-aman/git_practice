/**
 * src/controllers/applicationController.js
 *
 * HTTP Request handlers for Applications & Recruitment Workflow.
 */

'use strict';

const applicationService = require('../services/applicationService');
const asyncHandler = require('../utils/asyncHandler');

class ApplicationController {
  applyToDrive = asyncHandler(async (req, res) => {
    const driveId = req.params.id;
    const application = await applicationService.applyToDrive(req.user.id, driveId);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application },
    });
  });

  getMyApplications = asyncHandler(async (req, res) => {
    const applications = await applicationService.getStudentApplications(req.user.id);
    res.status(200).json({
      success: true,
      count: applications.length,
      data: { applications },
    });
  });

  getApplicationById = asyncHandler(async (req, res) => {
    const application = await applicationService.getApplicationById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  getDriveApplications = asyncHandler(async (req, res) => {
    const driveId = req.params.id;
    const statusFilter = req.query.status;
    const applications = await applicationService.getDriveApplications(driveId, statusFilter);

    res.status(200).json({
      success: true,
      count: applications.length,
      data: { applications },
    });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const applicationId = req.params.id;
    const { status, remarks } = req.body;

    const application = await applicationService.updateApplicationStatus(
      applicationId,
      status,
      remarks,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: { application },
    });
  });
}

module.exports = new ApplicationController();
