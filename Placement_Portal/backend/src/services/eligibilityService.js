/**
 * src/services/eligibilityService.js
 *
 * Core Eligibility Engine Service.
 *
 * Evaluates a student profile against placement drive criteria and returns:
 * {
 *   is_eligible: boolean,
 *   reasons: string[]  // Empty if eligible, detailed reasons if ineligible
 * }
 */

'use strict';

class EligibilityService {
  /**
   * Evaluate eligibility of a student for a specific drive.
   *
   * @param {object} studentProfile - { branch, cgpa, active_backlogs, graduation_year }
   * @param {object} drive - { minimum_cgpa, maximum_backlogs, graduation_year, application_deadline, eligible_branches }
   * @returns {{ is_eligible: boolean, reasons: string[] }}
   */
  evaluateEligibility(studentProfile, drive) {
    const reasons = [];

    if (!studentProfile) {
      return {
        is_eligible: false,
        reasons: ['Academic profile is incomplete. Please complete your profile first.'],
      };
    }

    // 1. Check Application Deadline
    const now = new Date();
    const deadline = new Date(drive.application_deadline);
    if (now > deadline) {
      reasons.push(`Application deadline passed on ${deadline.toISOString()}`);
    }

    // 2. Check Graduation Year
    if (Number(studentProfile.graduation_year) !== Number(drive.graduation_year)) {
      reasons.push(
        `Drive is restricted to ${drive.graduation_year} batch, but your graduation year is ${studentProfile.graduation_year}.`
      );
    }

    // 3. Check Eligible Branch
    const allowedBranches = (drive.eligible_branches || []).map((b) => b.toUpperCase());
    const studentBranch = (studentProfile.branch || '').toUpperCase();

    if (!allowedBranches.includes(studentBranch)) {
      reasons.push(
        `Branch '${studentProfile.branch}' is not eligible. Allowed branches: [${allowedBranches.join(', ')}].`
      );
    }

    // 4. Check Minimum CGPA
    const studentCgpa = Number(studentProfile.cgpa);
    const minCgpa = Number(drive.minimum_cgpa);
    if (studentCgpa < minCgpa) {
      reasons.push(`Minimum required CGPA is ${minCgpa.toFixed(2)}, but your CGPA is ${studentCgpa.toFixed(2)}.`);
    }

    // 5. Check Maximum Active Backlogs
    const studentBacklogs = Number(studentProfile.active_backlogs);
    const maxBacklogs = Number(drive.maximum_backlogs);
    if (studentBacklogs > maxBacklogs) {
      reasons.push(
        `Maximum allowed active backlogs is ${maxBacklogs}, but you have ${studentBacklogs} active backlog(s).`
      );
    }

    return {
      is_eligible: reasons.length === 0,
      reasons,
    };
  }
}

module.exports = new EligibilityService();
