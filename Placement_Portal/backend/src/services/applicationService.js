/**
 * src/services/applicationService.js
 *
 * Business logic for Student Applications & Recruitment Workflow.
 */

'use strict';

const applicationRepository = require('../repositories/applicationRepository');
const driveRepository       = require('../repositories/driveRepository');
const studentRepository     = require('../repositories/studentRepository');
const auditRepository       = require('../repositories/auditRepository');
const eligibilityService   = require('./eligibilityService');
const { validateStatusTransition } = require('../utils/stateMachine');
const AppError              = require('../utils/AppError');

class ApplicationService {
  /**
   * Student applies to a placement drive.
   */
  async applyToDrive(studentUserId, driveId) {
    // 1. Check drive exists
    const drive = await driveRepository.findById(driveId);
    if (!drive) {
      throw new AppError('Placement drive not found', 404, 'DRIVE_NOT_FOUND');
    }

    // 2. Check student profile exists
    const studentProfile = await studentRepository.findByUserId(studentUserId);
    if (!studentProfile) {
      throw new AppError('Academic profile incomplete. Please complete your profile first.', 400, 'PROFILE_INCOMPLETE');
    }

    // 3. Check Eligibility
    const evaluation = eligibilityService.evaluateEligibility(studentProfile, drive);
    if (!evaluation.is_eligible) {
      const err = new AppError('You are not eligible to apply for this placement drive.', 403, 'NOT_ELIGIBLE');
      err.details = evaluation.reasons;
      throw err;
    }

    // 4. Check Duplicate Application
    const existing = await applicationRepository.findByStudentAndDrive(studentUserId, driveId);
    if (existing) {
      throw new AppError('You have already applied for this placement drive.', 409, 'ALREADY_APPLIED');
    }

    // 5. Create application & default rounds
    const application = await applicationRepository.create(studentUserId, driveId);

    // Audit log
    await auditRepository.log({
      user_id: studentUserId,
      action: 'APPLICATION_SUBMITTED',
      entity_type: 'application',
      entity_id: application.id,
      metadata: { drive_id: driveId, job_role: drive.job_role },
    });

    return application;
  }

  /**
   * Get applications submitted by logged-in student.
   */
  async getStudentApplications(studentUserId) {
    return applicationRepository.findByStudent(studentUserId);
  }

  /**
   * Get application by ID.
   */
  async getApplicationById(id, requestingUser) {
    const application = await applicationRepository.findById(id);
    if (!application) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    // Authorization: Students can only view their own applications
    if (requestingUser.role === 'student' && application.student_id !== requestingUser.id) {
      throw new AppError('Access denied. You can only view your own applications.', 403, 'FORBIDDEN');
    }

    return application;
  }

  /**
   * Get all applicants for a drive (TPO view).
   */
  async getDriveApplications(driveId, statusFilter) {
    const drive = await driveRepository.findById(driveId);
    if (!drive) {
      throw new AppError('Placement drive not found', 404, 'DRIVE_NOT_FOUND');
    }

    return applicationRepository.findByDrive(driveId, statusFilter);
  }

  /**
   * Update candidate application status (TPO workflow).
   */
  async updateApplicationStatus(id, newStatus, remarks, actorUserId) {
    const application = await applicationRepository.findById(id);
    if (!application) {
      throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    // Enforce State Machine transition rules
    validateStatusTransition(application.status, newStatus);

    const updated = await applicationRepository.updateStatus(id, newStatus, remarks);

    // Write Audit Log
    await auditRepository.log({
      user_id: actorUserId,
      action: 'APPLICATION_STATUS_UPDATED',
      entity_type: 'application',
      entity_id: id,
      metadata: {
        previous_status: application.status,
        new_status: newStatus,
        remarks: remarks || null,
      },
    });

    return updated;
  }
}

module.exports = new ApplicationService();
