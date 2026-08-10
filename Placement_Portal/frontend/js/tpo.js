/**
 * js/tpo.js
 * Placement Portal — TPO Dashboard Module (ES6)
 *
 * Handles: company registration, drive creation, applicant pipeline
 *          management, recruitment status transitions.
 *
 * FSD Syllabus: AJAX calls, DOM manipulation, jQuery AJAX,
 *               JSON data processing, event handlers, ES6 features,
 *               template literals, destructuring, array methods.
 */

'use strict';

window.Portal = window.Portal || {};

window.Portal.Tpo = (() => {

  // Module state
  let companies        = [];
  let currentDriveId   = null;
  let currentDriveName = '';

  // ── Data Loading ─────────────────────────────────────────────────

  const loadDrives = async () => {
    $('#tpo-drives-loading').removeClass('hidden');
    $('#tpo-drives-grid, #tpo-drives-empty').addClass('hidden');

    try {
      const res = await Portal.API.getDrives();
      const drives = res.data.drives || [];

      $('#tpo-drives-loading').addClass('hidden');

      if (drives.length === 0) {
        $('#tpo-drives-empty').removeClass('hidden');
        return;
      }

      const $grid = $('#tpo-drives-grid').empty();
      drives.forEach(drive => $grid.append(Portal.UI.buildTpoDriveCard(drive)));
      $grid.removeClass('hidden');

      // Event delegation for "View Applicants" button
      $grid.off('click', '.view-applicants-btn').on('click', '.view-applicants-btn', function () {
        const driveId   = $(this).data('drive-id');
        const driveName = $(this).data('drive-name');
        loadApplicants(driveId, driveName);
      });

    } catch (err) {
      $('#tpo-drives-loading').addClass('hidden');
      Portal.UI.showToast('Failed to load drives.', 'error');
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await Portal.API.getCompanies();
      companies = res.data.companies || [];
      populateCompanySelect(companies);
    } catch {
      Portal.UI.showToast('Failed to load companies.', 'error');
    }
  };

  /**
   * Load applicants for a selected drive.
   * Uses jQuery AJAX (via api.js jqueryRequest) to demonstrate jQuery AJAX.
   * @param {number} driveId
   * @param {string} driveName
   */
  const loadApplicants = async (driveId, driveName) => {
    currentDriveId   = driveId;
    currentDriveName = driveName;

    const statusFilter = $('#status-filter').val();

    $('#pipeline-section').removeClass('hidden');
    $('#pipeline-drive-name').text(driveName);
    $('#pipeline-loading').removeClass('hidden');
    $('#pipeline-table-wrapper, #pipeline-empty').addClass('hidden');

    // Scroll to pipeline
    document.getElementById('pipeline-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      // NOTE: getDriveApplicants uses jQuery AJAX internally (see api.js)
      const res = await Portal.API.getDriveApplicants(driveId, statusFilter);
      const applicants = res.data?.applications || [];

      $('#pipeline-loading').addClass('hidden');

      if (applicants.length === 0) {
        $('#pipeline-empty').removeClass('hidden');
        return;
      }

      renderApplicantsTable(applicants);

    } catch (err) {
      $('#pipeline-loading').addClass('hidden');
      Portal.UI.showToast('Failed to load applicants.', 'error');
    }
  };

  // ── Rendering ────────────────────────────────────────────────────

  /**
   * Populate company select dropdown in drive creation form.
   * Demonstrates dynamic DOM element creation.
   * @param {Array} companies
   */
  const populateCompanySelect = (companies) => {
    const $select = $('#drive-company');
    $select.find('option:not(:first)').remove();
    companies.forEach(({ id, name }) => {
      $select.append(`<option value="${id}">${name}</option>`);
    });
  };

  /**
   * Render applicants table rows.
   * Demonstrates: creating and appending table rows, status badge rendering,
   *               state machine action buttons via template literals.
   * @param {Array} applicants
   */
  const renderApplicantsTable = (applicants) => {
    const $tbody = $('#pipeline-tbody').empty();

    applicants.forEach(({ id, student_name, roll_number, branch, cgpa, applied_at, status }) => {
      const actionHtml = buildActionButtons(id, status);

      const $row = $(`
        <tr data-app-id="${id}">
          <td>
            <strong>${student_name}</strong>
            <div class="text-xs text-slate-400">${roll_number || ''}</div>
          </td>
          <td>${branch || '—'}</td>
          <td><span class="font-semibold text-emerald-400">${cgpa || '—'}</span></td>
          <td>${Portal.UI.formatDate(applied_at)}</td>
          <td>${Portal.UI.statusBadge(status)}</td>
          <td class="text-right action-cell">${actionHtml}</td>
        </tr>
      `);
      $tbody.append($row);
    });

    $('#pipeline-table-wrapper').removeClass('hidden');

    // Bind workflow action buttons using event delegation
    $tbody.off('click', '.workflow-btn').on('click', '.workflow-btn', async function () {
      const appId     = $(this).data('app-id');
      const newStatus = $(this).data('next-status');
      await handleStatusTransition(appId, newStatus, this);
    });
  };

  /**
   * Build state machine action buttons for a candidate row.
   * Reflects the valid transitions: APPLIED→APTITUDE→TECHNICAL→HR→SELECTED
   * and REJECTED from any active state.
   *
   * @param {number} appId
   * @param {string} status
   * @returns {string} HTML
   */
  const buildActionButtons = (appId, status) => {
    const TRANSITIONS = {
      APPLIED:   'APTITUDE',
      APTITUDE:  'TECHNICAL',
      TECHNICAL: 'HR',
      HR:        'SELECTED',
    };

    const LABELS = {
      APTITUDE:  'Pass Aptitude',
      TECHNICAL: 'Pass Technical',
      HR:        'Pass HR Round',
      SELECTED:  'Select Candidate',
    };

    const nextStatus = TRANSITIONS[status];
    if (!nextStatus) return '—';  // Terminal state (SELECTED or REJECTED)

    const advanceBtn = `
      <button
        type="button"
        class="btn btn-primary workflow-btn"
        style="font-size:.78rem; padding:4px 10px;"
        data-app-id="${appId}"
        data-next-status="${nextStatus}"
        aria-label="${LABELS[nextStatus]}"
      >${LABELS[nextStatus]} →</button>
    `;

    const rejectBtn = `
      <button
        type="button"
        class="btn btn-danger workflow-btn ml-2"
        style="font-size:.78rem; padding:4px 10px;"
        data-app-id="${appId}"
        data-next-status="REJECTED"
        aria-label="Reject candidate"
      >Reject</button>
    `;

    return advanceBtn + rejectBtn;
  };

  // ── Event Handlers ───────────────────────────────────────────────

  /**
   * Handle recruitment status transition.
   * @param {number} appId
   * @param {string} newStatus
   * @param {HTMLElement} btn
   */
  const handleStatusTransition = async (appId, newStatus, btn) => {
    try {
      $(btn).prop('disabled', true).text('Updating...');
      await Portal.API.updateApplicationStatus(appId, newStatus, '');
      Portal.UI.showToast(`Candidate status updated to ${newStatus}.`, 'success');
      // Reload applicants for current drive
      await loadApplicants(currentDriveId, currentDriveName);
    } catch (err) {
      Portal.UI.showToast(err.message || 'Status update failed.', 'error');
      $(btn).prop('disabled', false);
    }
  };

  /**
   * Handle company form submission.
   * @param {Event} e
   */
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    const form    = document.getElementById('company-form');
    const errEl   = document.getElementById('company-form-error');
    const saveBtn = form.querySelector('button[type="submit"]');

    Portal.UI.setButtonLoading(saveBtn);
    if (errEl) errEl.classList.add('hidden');

    const name        = document.getElementById('company-name').value.trim();
    const website     = document.getElementById('company-website').value.trim();
    const description = document.getElementById('company-description').value.trim();

    if (!name) {
      if (errEl) { errEl.textContent = 'Company name is required.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, 'Save Company');
      return;
    }

    try {
      await Portal.API.createCompany({ name, website: website || undefined, description: description || undefined });
      Portal.UI.closeModal('company-modal');
      Portal.UI.showToast(`Company "${name}" registered successfully!`, 'success');
      form.reset();
      await loadCompanies();
    } catch (err) {
      if (errEl) { errEl.textContent = err.message || 'Failed to register company.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, 'Save Company');
    }
  };

  /**
   * Handle drive creation form submission.
   * @param {Event} e
   */
  const handleCreateDrive = async (e) => {
    e.preventDefault();
    const form    = document.getElementById('drive-form');
    const errEl   = document.getElementById('drive-form-error');
    const saveBtn = form.querySelector('button[type="submit"]');

    Portal.UI.setButtonLoading(saveBtn);
    if (errEl) errEl.classList.add('hidden');

    // Collect + parse form values (destructuring + ES6)
    const companyId   = parseInt(document.getElementById('drive-company').value, 10);
    const jobRole     = document.getElementById('drive-job-role').value.trim();
    const packageLpa  = parseFloat(document.getElementById('drive-package').value || '0');
    const location    = document.getElementById('drive-location').value.trim();
    const minCgpa     = parseFloat(document.getElementById('drive-min-cgpa').value);
    const maxBacklogs = parseInt(document.getElementById('drive-max-backlogs').value, 10);
    const gradYear    = parseInt(document.getElementById('drive-grad-year').value, 10);
    const deadlineVal = document.getElementById('drive-deadline').value;
    const branchesRaw = document.getElementById('drive-branches').value;

    // Parse comma-separated branches using array methods
    const eligibleBranches = branchesRaw
      .split(',')
      .map(b => b.trim().toUpperCase())
      .filter(b => b.length > 0);

    // Build ISO deadline
    const deadline = deadlineVal
      ? new Date(deadlineVal).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Validation
    if (!companyId || !jobRole || isNaN(minCgpa) || !gradYear) {
      if (errEl) { errEl.textContent = 'Company, Job Role, Minimum CGPA, and Graduation Year are required.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, 'Publish Drive');
      return;
    }

    const drivePayload = {
      company_id: companyId,
      job_role: jobRole,
      package_lpa: packageLpa || undefined,
      location: location || undefined,
      minimum_cgpa: minCgpa,
      maximum_backlogs: isNaN(maxBacklogs) ? 0 : maxBacklogs,
      graduation_year: gradYear,
      application_deadline: deadline,
      eligible_branches: eligibleBranches,
    };

    try {
      await Portal.API.createDrive(drivePayload);
      Portal.UI.closeModal('drive-modal');
      Portal.UI.showToast(`Drive "${jobRole}" published successfully!`, 'success');
      form.reset();
      await loadDrives();
    } catch (err) {
      if (errEl) { errEl.textContent = err.message || 'Failed to publish drive.'; errEl.classList.remove('hidden'); }
      Portal.UI.resetButton(saveBtn, 'Publish Drive');
    }
  };

  // ── Bind All Events ──────────────────────────────────────────────

  const bindEvents = () => {
    // Company modal
    $('#open-company-modal').on('click', () => Portal.UI.openModal('company-modal'));
    $('#close-company-modal, #cancel-company-modal').on('click', () => Portal.UI.closeModal('company-modal'));
    document.getElementById('company-form')?.addEventListener('submit', handleCreateCompany);

    // Drive modal
    $('#open-drive-modal').on('click', () => Portal.UI.openModal('drive-modal'));
    $('#close-drive-modal, #cancel-drive-modal').on('click', () => Portal.UI.closeModal('drive-modal'));
    document.getElementById('drive-form')?.addEventListener('submit', handleCreateDrive);

    // Pipeline close
    $('#close-pipeline').on('click', () => {
      $('#pipeline-section').addClass('hidden');
      currentDriveId = null;
    });

    // Status filter — re-load applicants when filter changes
    $('#status-filter').on('change', function () {
      if (currentDriveId) {
        loadApplicants(currentDriveId, currentDriveName);
      }
    });
  };

  // ── Main Initialiser ─────────────────────────────────────────────

  const init = async () => {
    bindEvents();
    await Promise.all([loadCompanies(), loadDrives()]);
  };

  return { init };

})();
