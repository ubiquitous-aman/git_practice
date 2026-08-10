/**
 * js/student.js
 * Placement Portal — Student Dashboard Module (ES6)
 *
 * Handles: profile loading/saving, drive listing with eligibility,
 *          application submission, application history rendering.
 *
 * FSD Syllabus: DOM manipulation (selecting, modifying, creating,
 *               removing elements), AJAX API calls, JSON data
 *               processing, ES6 arrow functions, async/await,
 *               event handlers, jQuery DOM methods, template literals.
 */

'use strict';

window.Portal = window.Portal || {};

window.Portal.Student = (() => {

  // Local state (ES6 module-scoped variables)
  let currentProfile  = null;
  let currentDrives   = [];
  let myApplications  = [];

  // ── Data Fetching ────────────────────────────────────────────────

  /**
   * Load student's own academic profile from the API.
   * Demonstrates AJAX call, JSON data handling, conditional DOM manipulation.
   */
  const loadProfile = async () => {
    try {
      const res = await Portal.API.getProfile();
      currentProfile = res.data.profile;
      renderProfileBanner(currentProfile);
    } catch (err) {
      if (err.status === 404) {
        // No profile yet — show incomplete warning and open modal
        currentProfile = null;
        renderProfileBanner(null);
        Portal.UI.openModal('profile-modal');
      }
    }
  };

  /**
   * Load placement drives from the API.
   * Each drive returned for a student includes an `eligibility` object.
   */
  const loadDrives = async () => {
    // Show loading state
    $('#drives-loading').removeClass('hidden');
    $('#drives-grid, #drives-empty, #drives-error').addClass('hidden');

    try {
      const res = await Portal.API.getDrives();
      currentDrives = res.data.drives || [];

      // Hide loading
      $('#drives-loading').addClass('hidden');

      if (currentDrives.length === 0) {
        $('#drives-empty').removeClass('hidden');
        return;
      }

      // Render the grid — DOM manipulation via innerHTML
      const $grid = $('#drives-grid');
      $grid.empty();

      currentDrives.forEach((drive) => {
        const applied  = myApplications.some(app => app.drive_id === drive.id);
        const cardHtml = Portal.UI.buildDriveCard(drive, applied);
        $grid.append(cardHtml);
      });

      $grid.removeClass('hidden');

      // Update count badge
      const countBadge = document.getElementById('drives-count-badge');
      if (countBadge) {
        countBadge.textContent = `${currentDrives.length} drives`;
        countBadge.classList.remove('hidden');
      }

      // Bind apply button clicks using jQuery event delegation
      $grid.off('click', '.apply-btn').on('click', '.apply-btn', async function () {
        const driveId = $(this).data('drive-id');
        await handleApply(driveId, this);
      });

    } catch (err) {
      $('#drives-loading').addClass('hidden');
      $('#drives-error').removeClass('hidden');
      Portal.UI.showToast('Failed to load placement drives.', 'error');
    }
  };

  /**
   * Load the student's submitted applications.
   */
  const loadApplications = async () => {
    try {
      const res = await Portal.API.getMyApplications();
      myApplications = res.data.applications || [];
      renderApplicationsTable(myApplications);
    } catch {
      myApplications = [];
    }
  };

  // ── Rendering (DOM Manipulation) ─────────────────────────────────

  /**
   * Render the academic profile banner.
   * Demonstrates selective DOM content modification.
   *
   * @param {object|null} profile
   */
  const renderProfileBanner = (profile) => {
    const summaryEl = document.getElementById('profile-summary');
    const warningEl = document.getElementById('profile-missing-warning');
    const btnLabel  = document.getElementById('profile-btn-label');

    if (profile) {
      // Build summary text using template literal (ES6)
      const summaryText = `Roll: ${profile.roll_number} | Branch: ${profile.branch} | CGPA: ${profile.cgpa} | Backlogs: ${profile.active_backlogs} | Batch: ${profile.graduation_year}`;

      if (summaryEl) {
        summaryEl.textContent = summaryText;
        summaryEl.classList.remove('hidden');
      }
      if (warningEl) warningEl.classList.add('hidden');
      if (btnLabel)  btnLabel.textContent = 'Edit Profile';

      // Pre-fill modal form with existing profile data
      document.getElementById('roll-number').value       = profile.roll_number;
      document.getElementById('branch').value            = profile.branch;
      document.getElementById('cgpa').value              = profile.cgpa;
      document.getElementById('active-backlogs').value   = profile.active_backlogs;
      document.getElementById('graduation-year').value   = profile.graduation_year;

    } else {
      if (summaryEl) summaryEl.classList.add('hidden');
      if (warningEl) warningEl.classList.remove('hidden');
      if (btnLabel)  btnLabel.textContent = 'Setup Profile';
    }
  };

  /**
   * Render the applications history table.
   * Demonstrates: creating table rows dynamically with DOM, status badges.
   *
   * @param {Array} applications
   */
  const renderApplicationsTable = (applications) => {
    const loadingEl = document.getElementById('applications-loading');
    const emptyEl   = document.getElementById('applications-empty');
    const wrapperEl = document.getElementById('applications-table-wrapper');
    const tbody     = document.getElementById('applications-tbody');

    if (loadingEl) loadingEl.classList.add('hidden');

    if (!applications || applications.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    // Build table rows using jQuery
    const $tbody = $(tbody).empty();

    applications.forEach(({ company_name, job_role, applied_at, status }) => {
      const $row = $(`
        <tr>
          <td>
            <strong>${company_name || '—'}</strong>
          </td>
          <td>${job_role || '—'}</td>
          <td>${Portal.UI.formatDate(applied_at)}</td>
          <td>${Portal.UI.statusBadge(status)}</td>
        </tr>
      `);
      $tbody.append($row);
    });

    if (wrapperEl) wrapperEl.classList.remove('hidden');
  };

  // ── Event Handlers ───────────────────────────────────────────────

  /**
   * Handle Apply button click.
   * @param {number} driveId
   * @param {HTMLElement} btn
   */
  const handleApply = async (driveId, btn) => {
    const originalText = $(btn).text().trim();
    Portal.UI.setButtonLoading(btn);

    try {
      await Portal.API.applyToDrive(driveId);
      Portal.UI.showToast('Application submitted successfully!', 'success');

      // Update inline message
      const inlineMsg = document.getElementById('inline-message');
      if (inlineMsg) {
        inlineMsg.textContent = '✓ Application submitted! You can view its status in "My Applications" below.';
        inlineMsg.classList.remove('hidden');
      }

      // Reload data to refresh eligibility states and application list
      await loadApplications();
      await loadDrives();

    } catch (err) {
      Portal.UI.showToast(err.message || 'Failed to submit application.', 'error');
      Portal.UI.resetButton(btn, originalText);
    }
  };

  /**
   * Handle profile form submission.
   * @param {Event} e
   */
  const handleProfileSave = async (e) => {
    e.preventDefault();

    const form = document.getElementById('profile-form');
    const errEl = document.getElementById('profile-form-error');
    const saveBtn = document.getElementById('save-profile-btn');
    const originalText = 'Save Profile';

    Portal.UI.setButtonLoading(saveBtn);
    if (errEl) errEl.classList.add('hidden');

    // Collect form data using FormData (DOM API)
    const formData = new FormData(form);
    const profilePayload = {
      roll_number:      formData.get('roll_number')?.trim(),
      branch:           formData.get('branch'),
      cgpa:             parseFloat(formData.get('cgpa')),
      active_backlogs:  parseInt(formData.get('active_backlogs'), 10),
      graduation_year:  parseInt(formData.get('graduation_year'), 10),
    };

    // Client-side validation
    if (!profilePayload.roll_number) {
      if (errEl) { errEl.textContent = 'Roll number is required.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, originalText);
      return;
    }
    if (isNaN(profilePayload.cgpa) || profilePayload.cgpa < 0 || profilePayload.cgpa > 10) {
      if (errEl) { errEl.textContent = 'CGPA must be between 0.00 and 10.00.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, originalText);
      return;
    }

    try {
      await Portal.API.saveProfile(profilePayload);
      Portal.UI.closeModal('profile-modal');
      Portal.UI.showToast('Academic profile saved successfully!', 'success');

      // Reload all dashboard data
      await Promise.all([loadProfile(), loadApplications(), loadDrives()]);

    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || 'Failed to save profile.';
        errEl.classList.remove('hidden');
      }
      Portal.UI.resetButton(saveBtn, originalText);
    }
  };

  // ── Modal Event Bindings ─────────────────────────────────────────

  const bindModalEvents = () => {
    // Open profile modal
    $('#open-profile-modal').on('click', () => Portal.UI.openModal('profile-modal'));

    // Close profile modal buttons
    $('#close-profile-modal, #cancel-profile-modal').on('click', () => {
      Portal.UI.closeModal('profile-modal');
    });

    // Profile form submission
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileSave);
  };

  // ── Main Initialiser ─────────────────────────────────────────────

  /**
   * Initialise the Student Dashboard.
   * Loads data sequentially to ensure applications are available
   * when rendering drive eligibility.
   */
  const init = async () => {
    bindModalEvents();

    // Load applications first so drive cards know which are applied
    await loadApplications();
    // Then load profile and drives in parallel
    await Promise.all([loadProfile(), loadDrives()]);
  };

  // ── Public API ───────────────────────────────────────────────────
  return { init, loadDrives };

})();
