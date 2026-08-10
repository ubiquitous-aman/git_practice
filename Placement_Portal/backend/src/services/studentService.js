/**
 * src/services/studentService.js
 *
 * Business logic for student profiles.
 */

'use strict';

const studentRepository = require('../repositories/studentRepository');
const AppError = require('../utils/AppError');

class StudentService {
  /**
   * Get student profile by user_id
   */
  async getProfile(userId) {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Student profile not found. Please create your profile first.', 404, 'PROFILE_NOT_FOUND');
    }
    return profile;
  }

  /**
   * Create or Update student profile
   */
  async updateProfile(userId, profileData) {
    // Check if roll number is already taken by ANOTHER user
    const existingWithRoll = await studentRepository.findByRollNumber(profileData.roll_number);
    if (existingWithRoll && existingWithRoll.user_id !== userId) {
      throw new AppError('A student with this roll number already exists', 409, 'DUPLICATE_ROLL_NUMBER');
    }

    const updatedProfile = await studentRepository.upsertProfile(userId, profileData);
    return updatedProfile;
  }
}

module.exports = new StudentService();
