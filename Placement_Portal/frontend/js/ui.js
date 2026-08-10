/**
 * js/ui.js
 * Placement Portal — Shared UI Utilities (jQuery + ES6)
 *
 * Handles: toast notifications, modal control, DOM helpers,
 *          date formatting, badge rendering.
 *
 * FSD Syllabus: jQuery selectors, jQuery events, jQuery DOM
 *               manipulation, dynamic element creation,
 *               ES6 template literals, arrow functions.
 */

'use strict';

window.Portal = window.Portal || {};

window.Portal.UI = (() => {

  // ── Toast Notifications ──────────────────────────────────────────

  /**
   * Show a toast notification.
   * Uses jQuery for DOM creation and event binding.
   *
   * @param {string} message  - Message text
   * @param {'success'|'error'|'info'} type
   * @param {number} [duration=3500] - Auto-dismiss delay in ms
   */
  const showToast = (message, type = 'info', duration = 3500) => {
    const icons = {
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };

    const $toast = $(`
      <div class="toast toast-${type}" role="alert" aria-live="assertive">
        ${icons[type] || ''}
        <span>${message}</span>
      </div>
    `);

    $('#toast-container').append($toast);

    // Auto-dismiss after duration
    const timer = setTimeout(() => dismissToast($toast), duration);

    // Click to dismiss early
    $toast.on('click', () => {
      clearTimeout(timer);
      dismissToast($toast);
    });
  };

  const dismissToast = ($toast) => {
    $toast.css({
      animation: 'slideOutRight 0.25s ease-in forwards',
    });
    setTimeout(() => $toast.remove(), 250);
  };

  // ── Modal Control (jQuery) ───────────────────────────────────────

  /**
   * Open a modal by its ID.
   * @param {string} modalId
   */
  const openModal = (modalId) => {
    const $modal = $(`#${modalId}`);
    $modal.removeClass('hidden');
    // Trap focus to first focusable element in modal
    $modal.find('input, select, textarea, button').first().focus();
    // Prevent body scroll
    $('body').css('overflow', 'hidden');
  };

  /**
   * Close a modal by its ID.
   * @param {string} modalId
   */
  const closeModal = (modalId) => {
    $(`#${modalId}`).addClass('hidden');
    $('body').css('overflow', '');
  };

  /**
   * Close modal when backdrop (overlay itself) is clicked.
   * Uses jQuery event delegation.
   */
  const bindModalBackdropClose = () => {
    $(document).on('click', '.modal-overlay', function (e) {
      if ($(e.target).hasClass('modal-overlay')) {
        $(this).addClass('hidden');
        $('body').css('overflow', '');
      }
    });

    // Close modals on Escape key
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') {
        $('.modal-overlay:not(.hidden)').addClass('hidden');
        $('body').css('overflow', '');
      }
    });
  };

  // ── Badge Rendering ──────────────────────────────────────────────

  /**
   * Generate a status badge HTML string.
   * @param {string} status
   * @returns {string} HTML string
   */
  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    return `<span class="badge badge-${s}">${status}</span>`;
  };

  // ── Date Formatting ──────────────────────────────────────────────

  /**
   * Format an ISO date string into a human-friendly format.
   * @param {string} isoString
   * @returns {string}
   */
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Loading State Helpers ────────────────────────────────────────

  /**
   * Show a button in loading state (spinner + disabled).
   * @param {HTMLButtonElement} btn
   */
  const setButtonLoading = (btn) => {
    const $btn = $(btn);
    $btn.prop('disabled', true);
    $btn.find('span:first').text(
      $btn.find('span:first').text().replace(/\.{0,3}$/, '...')
    );
    $btn.find('.spinner').removeClass('hidden');
  };

  /**
   * Reset a button to its normal state.
   * @param {HTMLButtonElement} btn
   * @param {string} originalText
   */
  const resetButton = (btn, originalText) => {
    const $btn = $(btn);
    $btn.prop('disabled', false);
    $btn.find('span:first').text(originalText);
    $btn.find('.spinner').addClass('hidden');
  };

  // ── Drive Card Generator ─────────────────────────────────────────

  /**
   * Generate the HTML for a placement drive card (Student view).
   * Demonstrates template literals and destructuring.
   *
   * @param {object} drive
   * @param {boolean} applied
   * @returns {string} HTML string
   */
  const buildDriveCard = (drive, applied) => {
    const {
      id, job_role, company_name, package_lpa,
      location, minimum_cgpa, maximum_backlogs,
      eligible_branches = [], eligibility = {}
    } = drive;

    const { is_eligible = false, reasons = [] } = eligibility;

    let badgeHtml;
    if (applied) {
      badgeHtml = `<span class="badge badge-applied">Applied</span>`;
    } else if (is_eligible) {
      badgeHtml = `<span class="badge badge-eligible">Eligible</span>`;
    } else {
      badgeHtml = `<span class="badge badge-ineligible">Ineligible</span>`;
    }

    const branchPills = eligible_branches
      .map(b => `<span class="branch-pill">${b}</span>`)
      .join('');

    const reasonsHtml = (!is_eligible && reasons.length > 0 && !applied)
      ? `<div class="ineligibility-reasons">
           <p class="reasons-title">Ineligibility reasons:</p>
           <ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>
         </div>`
      : '';

    const applyBtnClass = applied
      ? 'btn btn-secondary w-full opacity-60'
      : is_eligible
        ? 'btn btn-primary w-full'
        : 'btn btn-secondary w-full opacity-60';

    const applyBtnText = applied
      ? '✓ Applied'
      : is_eligible
        ? 'Apply Now'
        : 'Not Eligible';

    return `
      <article class="glass-card drive-card" data-drive-id="${id}" aria-label="Drive: ${job_role} at ${company_name}">
        <div class="drive-card-header">
          <div>
            <h3 class="drive-title">${job_role}</h3>
            <p class="drive-company">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              ${company_name}
            </p>
          </div>
          ${badgeHtml}
        </div>

        <dl class="drive-meta">
          <div>
            <dt>Package</dt>
            <dd class="text-emerald">${package_lpa ? `${package_lpa} LPA` : 'N/A'}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>${location || 'Pan India'}</dd>
          </div>
          <div>
            <dt>Min CGPA</dt>
            <dd>${minimum_cgpa}</dd>
          </div>
          <div>
            <dt>Max Backlogs</dt>
            <dd>${maximum_backlogs}</dd>
          </div>
        </dl>

        <div class="drive-branches">
          <p class="branches-label">Eligible Branches</p>
          <div class="branches-list">${branchPills}</div>
        </div>

        ${reasonsHtml}

        <button
          type="button"
          class="${applyBtnClass} mt-3 apply-btn"
          data-drive-id="${id}"
          ${(applied || !is_eligible) ? 'disabled' : ''}
          aria-label="${applyBtnText} for ${job_role} at ${company_name}"
        >
          ${applyBtnText}
        </button>
      </article>
    `;
  };

  /**
   * Generate the HTML for a TPO drive card.
   * @param {object} drive
   * @returns {string} HTML string
   */
  const buildTpoDriveCard = (drive) => {
    const { id, job_role, company_name, package_lpa, minimum_cgpa } = drive;
    return `
      <article class="glass-card" aria-label="Drive: ${job_role}" data-drive-id="${id}">
        <div class="flex items-start justify-between mb-2">
          <h3 class="text-base font-bold text-white">${job_role}</h3>
          <span class="badge badge-applied">${company_name}</span>
        </div>
        <p class="text-sm text-slate-400 mb-4">
          Package: <strong class="text-emerald-400">${package_lpa} LPA</strong>
          &nbsp;|&nbsp; Min CGPA: <strong class="text-white">${minimum_cgpa}</strong>
        </p>
        <button
          type="button"
          class="btn btn-secondary w-full text-sm view-applicants-btn"
          data-drive-id="${id}"
          data-drive-name="${job_role} @ ${company_name}"
          aria-label="View applicants for ${job_role}"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          View Applicants
        </button>
      </article>
    `;
  };

  // ── Initialise global UI behaviours ─────────────────────────────
  const init = () => {
    bindModalBackdropClose();
  };

  // ── Public API ───────────────────────────────────────────────────
  return {
    showToast,
    openModal,
    closeModal,
    statusBadge,
    formatDate,
    setButtonLoading,
    resetButton,
    buildDriveCard,
    buildTpoDriveCard,
    init,
  };

})();

// Initialise shared UI behaviours when DOM is ready
$(document).ready(function () {
  Portal.UI.init();

  // Add inline CSS for drive card sub-elements (keeps styles.css cleaner)
  const cardStyles = `
    .drive-card { display:flex; flex-direction:column; }
    .drive-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
    .drive-title { font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:3px; }
    .drive-company { font-size:0.85rem; color:var(--color-cyan); font-weight:600; display:flex; align-items:center; gap:5px; }
    .drive-meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.82rem; color:var(--text-muted); margin-bottom:12px; }
    .drive-meta dt { margin-bottom:1px; }
    .drive-meta dd { color:#fff; font-weight:600; }
    .text-emerald { color:var(--color-emerald) !important; }
    .drive-branches { margin-bottom:10px; }
    .branches-label { font-size:0.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--text-subtle); margin-bottom:5px; }
    .branches-list { display:flex; flex-wrap:wrap; gap:5px; }
    .branch-pill { background:rgba(255,255,255,0.08); padding:2px 7px; border-radius:4px; font-size:0.75rem; color:#f8fafc; }
    .ineligibility-reasons { background:rgba(244,63,94,.1); border:1px solid rgba(244,63,94,.2); padding:10px 12px; border-radius:6px; margin-bottom:10px; }
    .reasons-title { font-size:.75rem; font-weight:600; color:var(--color-rose); margin-bottom:4px; }
    .ineligibility-reasons ul { padding-left:14px; font-size:.75rem; color:#fda4af; }
    .apply-btn { margin-top:auto; }
    .w-full { width:100%; }
  `;

  if (!document.getElementById('portal-card-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'portal-card-styles';
    styleEl.textContent = cardStyles;
    document.head.appendChild(styleEl);
  }
});
