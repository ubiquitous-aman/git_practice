/**
 * src/utils/stateMachine.js
 *
 * State Machine for recruitment application status transitions.
 * Enforces valid recruitment progression and prevents arbitrary status jumps.
 */

'use strict';

const AppError = require('./AppError');

const VALID_STATUSES = ['APPLIED', 'APTITUDE', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED'];

const ALLOWED_TRANSITIONS = {
  APPLIED: ['APTITUDE', 'REJECTED'],
  APTITUDE: ['TECHNICAL', 'REJECTED'],
  TECHNICAL: ['HR', 'REJECTED'],
  HR: ['SELECTED', 'REJECTED'],
  SELECTED: [], // Terminal state
  REJECTED: [], // Terminal state
};

/**
 * Validate status transition from currentStatus to nextStatus.
 *
 * @param {string} currentStatus
 * @param {string} nextStatus
 */
function validateStatusTransition(currentStatus, nextStatus) {
  if (!VALID_STATUSES.includes(nextStatus)) {
    throw new AppError(
      `Invalid status '${nextStatus}'. Valid statuses are: [${VALID_STATUSES.join(', ')}]`,
      400,
      'INVALID_STATUS'
    );
  }

  if (currentStatus === nextStatus) {
    return; // No-op transition
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(nextStatus)) {
    throw new AppError(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions from '${currentStatus}' are: [${allowedNext.join(', ')}]`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

module.exports = {
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  validateStatusTransition,
};
