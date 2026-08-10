/**
 * src/services/driveService.js
 *
 * Business logic layer for placement drives & eligibility checks.
 */

'use strict';

const driveRepository = require('../repositories/driveRepository');
const companyRepository = require('../repositories/companyRepository');
const studentRepository = require('../repositories/studentRepository');
const eligibilityService = require('./eligibilityService');
const AppError = require('../utils/AppError');

class DriveService {
  async getAllDrives() {
    return driveRepository.findAll();
  }

  async getDriveById(id) {
    const drive = await driveRepository.findById(id);
    if (!drive) {
      throw new AppError('Placement drive not found', 404, 'DRIVE_NOT_FOUND');
    }
    return drive;
  }

  async createDrive(driveData) {
    // Verify company exists
    const company = await companyRepository.findById(driveData.company_id);
    if (!company) {
      throw new AppError('Referenced company does not exist', 400, 'INVALID_COMPANY');
    }

    return driveRepository.create(driveData);
  }

  async updateDrive(id, driveData) {
    await this.getDriveById(id);

    const company = await companyRepository.findById(driveData.company_id);
    if (!company) {
      throw new AppError('Referenced company does not exist', 400, 'INVALID_COMPANY');
    }

    return driveRepository.update(id, driveData);
  }

  async deleteDrive(id) {
    await this.getDriveById(id);
    await driveRepository.delete(id);
  }

  /**
   * Evaluate eligibility for a student for a specified drive.
   */
  async checkEligibility(studentUserId, driveId) {
    const drive = await this.getDriveById(driveId);
    const studentProfile = await studentRepository.findByUserId(studentUserId);

    const evaluation = eligibilityService.evaluateEligibility(studentProfile, drive);

    return {
      drive_id: drive.id,
      job_role: drive.job_role,
      company_name: drive.company_name,
      student_profile: studentProfile
        ? {
            roll_number: studentProfile.roll_number,
            branch: studentProfile.branch,
            cgpa: studentProfile.cgpa,
            active_backlogs: studentProfile.active_backlogs,
            graduation_year: studentProfile.graduation_year,
          }
        : null,
      ...evaluation,
    };
  }
}

module.exports = new DriveService();
