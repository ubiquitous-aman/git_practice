/**
 * js/api.js
 * Placement Portal — API Client Module (ES6)
 *
 * Provides a thin wrapper around the Fetch API for communicating
 * with the backend REST API. Handles JWT injection, JSON parsing,
 * and error normalisation.
 *
 * FSD Syllabus: ES6 modules, async/await, Fetch API (AJAX),
 *               JSON parsing, arrow functions, const/let,
 *               template literals, error handling.
 */

'use strict';

// ── Namespace ─────────────────────────────────────────────────────
window.Portal = window.Portal || {};

/* Global API base URL — edit this to point to your backend */
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Core request function.
 * All API calls flow through this function.
 *
 * @param {string} endpoint  - e.g. '/auth/login'
 * @param {string} method    - HTTP method: GET | POST | PUT | PATCH | DELETE
 * @param {object} [body]    - JSON request body (optional)
 * @returns {Promise<object>} Parsed JSON response body
 */
const request = async (endpoint, method = 'GET', body = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Attach JWT token from localStorage if present
  const token = localStorage.getItem('portal_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  // Parse JSON response (success or error)
  let data;
  try {
    data = await response.json();
  } catch (_parseError) {
    throw new Error('Server returned an invalid response. Please try again.');
  }

  // Handle HTTP 401 — token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    if (!window.location.href.includes('index.html')) {
      window.location.href = 'index.html';
    }
  }

  if (!response.ok) {
    // Throw structured error from backend
    const message = data?.error?.message || `Request failed with status ${response.status}`;
    const code    = data?.error?.code    || 'API_ERROR';
    const err = new Error(message);
    err.code    = code;
    err.details = data?.error?.details || null;
    err.status  = response.status;
    throw err;
  }

  return data;
};

/**
 * jQuery AJAX wrapper — demonstrates jQuery AJAX usage alongside Fetch.
 * Used in specific places where jQuery is already loaded for DOM work.
 *
 * @param {string} endpoint
 * @param {string} method
 * @param {object} [body]
 * @returns {Promise<object>}
 */
const jqueryRequest = (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('portal_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return $.ajax({
    url: `${API_BASE_URL}${endpoint}`,
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
    dataType: 'json',
  });
};

// ── Exported API methods ──────────────────────────────────────────
window.Portal.API = {
  // Auth
  login:    (email, password) => request('/auth/login', 'POST', { email, password }),
  register: (name, email, password) => request('/auth/register', 'POST', { name, email, password }),
  getMe:    () => request('/auth/me'),

  // Student Profile
  getProfile:  () => request('/students/profile'),
  saveProfile: (profileData) => request('/students/profile', 'PUT', profileData),

  // Placement Drives
  getDrives:  () => request('/drives'),
  getDriveById: (id) => request(`/drives/${id}`),

  // Applications
  applyToDrive:     (driveId) => request(`/applications/drives/${driveId}/apply`, 'POST'),
  getMyApplications: () => request('/applications/me'),

  // Companies (TPO)
  getCompanies:   () => request('/companies'),
  createCompany:  (data) => request('/companies', 'POST', data),

  // Drives (TPO)
  createDrive: (data) => request('/drives', 'POST', data),

  // Applications (TPO) — uses jQuery AJAX to demonstrate the concept
  getDriveApplicants: (driveId, statusFilter) => {
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    return jqueryRequest(`/applications/drives/${driveId}/applications${qs}`);
  },

  updateApplicationStatus: (applicationId, status, remarks) =>
    request(`/applications/${applicationId}/status`, 'PATCH', { status, remarks }),
};
