/**
 * tests/eligibility.test.js
 *
 * Unit tests for Eligibility Engine Service.
 */

'use strict';

const eligibilityService = require('../src/services/eligibilityService');

describe('Eligibility Engine Service', () => {
  const sampleDrive = {
    minimum_cgpa: 7.0,
    maximum_backlogs: 0,
    graduation_year: 2027,
    application_deadline: '2099-12-31T23:59:59Z', // far future
    eligible_branches: ['CSE', 'IT'],
  };

  it('should return eligible = true when student meets all criteria', () => {
    const student = {
      branch: 'CSE',
      cgpa: 8.5,
      active_backlogs: 0,
      graduation_year: 2027,
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('should return eligible = false when CGPA is below minimum', () => {
    const student = {
      branch: 'CSE',
      cgpa: 6.5,
      active_backlogs: 0,
      graduation_year: 2027,
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(false);
    expect(result.reasons[0]).toContain('Minimum required CGPA is 7.00');
  });

  it('should return eligible = false when active backlogs exceed maximum allowed', () => {
    const student = {
      branch: 'CSE',
      cgpa: 8.5,
      active_backlogs: 2,
      graduation_year: 2027,
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(false);
    expect(result.reasons[0]).toContain('Maximum allowed active backlogs is 0');
  });

  it('should return eligible = false when student branch is not eligible', () => {
    const student = {
      branch: 'MECH',
      cgpa: 8.5,
      active_backlogs: 0,
      graduation_year: 2027,
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(false);
    expect(result.reasons[0]).toContain("Branch 'MECH' is not eligible");
  });

  it('should return eligible = false when graduation year does not match', () => {
    const student = {
      branch: 'CSE',
      cgpa: 8.5,
      active_backlogs: 0,
      graduation_year: 2026,
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(false);
    expect(result.reasons[0]).toContain('Drive is restricted to 2027 batch');
  });

  it('should return multiple reasons when multiple criteria fail', () => {
    const student = {
      branch: 'CIVIL', // invalid branch
      cgpa: 5.5,     // low CGPA
      active_backlogs: 1, // backlogs fail
      graduation_year: 2025, // year fail
    };

    const result = eligibilityService.evaluateEligibility(student, sampleDrive);
    expect(result.is_eligible).toBe(false);
    expect(result.reasons.length).toBe(4);
  });
});
