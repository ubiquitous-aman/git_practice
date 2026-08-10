/**
 * js/auth.js
 * Placement Portal — Authentication Module (ES6)
 *
 * Handles login, registration, token storage, session validation,
 * and route protection.
 *
 * FSD Syllabus: Variables (let/const), functions, objects,
 *               ES6 arrow functions, form validation,
 *               DOM manipulation, events/event handlers,
 *               localStorage, conditional logic.
 */

'use strict';

window.Portal = window.Portal || {};

window.Portal.Auth = (() => {

  // ── Private helpers ─────────────────────────────────────────────

  /**
   * Save user session data to localStorage.
   * @param {string} token
   * @param {object} user
   */
  const saveSession = (token, user) => {
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_user', JSON.stringify(user));
  };

  /**
   * Clear user session data from localStorage.
   */
  const clearSession = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
  };

  /**
   * Retrieve the currently authenticated user object from localStorage.
   * @returns {object|null}
   */
  const getUser = () => {
    const raw = localStorage.getItem('portal_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  /**
   * Returns true if a valid token exists in localStorage.
   * @returns {boolean}
   */
  const isAuthenticated = () => !!localStorage.getItem('portal_token');

  // ── Validation helpers ───────────────────────────────────────────

  /**
   * Validate an email address format.
   * @param {string} email
   * @returns {boolean}
   */
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  /**
   * Calculate password strength score (0–3).
   * Demonstrates string methods and ES6 features.
   * @param {string} password
   * @returns {number}
   */
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6)  score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9!@#$%^&*]/.test(password)) score++;
    return score;
  };

  /**
   * Show a field-level validation error.
   * @param {string} fieldId
   * @param {string} message
   */
  const showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (field) field.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  };

  /**
   * Clear all validation errors in a form.
   * @param {HTMLFormElement} form
   */
  const clearErrors = (form) => {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  };

  // ── Page Initialisers ────────────────────────────────────────────

  /**
   * Redirect already-authenticated users away from auth pages.
   */
  const redirectIfAuthenticated = () => {
    if (!isAuthenticated()) return;
    const user = getUser();
    if (!user) return;
    window.location.href = user.role === 'student' ? 'student.html' : 'tpo.html';
  };

  /**
   * Protect a page by role.
   * Redirects unauthenticated users to login.
   * Redirects users with wrong role to their correct dashboard.
   * @param {string|string[]} requiredRole
   */
  const requireAuth = (requiredRole) => {
    if (!isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    const user = getUser();
    if (!user) {
      clearSession();
      window.location.href = 'index.html';
      return;
    }

    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowed.includes(user.role)) {
      // Wrong role — redirect to correct dashboard
      window.location.href = user.role === 'student' ? 'student.html' : 'tpo.html';
      return;
    }

    // Populate navbar user info using DOM manipulation
    const navUsername = document.getElementById('nav-username');
    const navRoleBadge = document.getElementById('nav-role-badge');
    if (navUsername) navUsername.textContent = user.name;
    if (navRoleBadge) navRoleBadge.textContent = user.role;

    // Bind logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  };

  /**
   * Logout the current user.
   */
  const logout = () => {
    clearSession();
    window.location.href = 'index.html';
  };

  /**
   * Quick-fill demo credentials (development aid).
   * @param {string} email
   * @param {string} password
   */
  const quickFill = (email, password) => {
    const emailEl = document.getElementById('email');
    const passEl  = document.getElementById('password');
    if (emailEl) emailEl.value = email;
    if (passEl)  passEl.value  = password;
    Portal.UI.showToast('Demo credentials filled!', 'info');
  };

  // ── Login Page Initialiser ───────────────────────────────────────

  const initLoginPage = () => {
    redirectIfAuthenticated();

    const form     = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const errorTxt = document.getElementById('login-error-text');
    const btnText  = document.getElementById('login-btn-text');
    const spinner  = document.getElementById('login-spinner');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      // Client-side validation
      let hasError = false;
      if (!email) {
        showFieldError('email', 'Email is required.');
        hasError = true;
      } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address.');
        hasError = true;
      }
      if (!password) {
        showFieldError('password', 'Password is required.');
        hasError = true;
      }
      if (hasError) return;

      // Show loading state
      btnText.textContent = 'Signing in...';
      spinner.classList.remove('hidden');
      form.querySelector('button[type="submit"]').disabled = true;
      errorBox.classList.add('hidden');

      try {
        const response = await Portal.API.login(email, password);
        const { user, token } = response.data;
        saveSession(token, user);
        Portal.UI.showToast(`Welcome back, ${user.name}!`, 'success');

        // Short delay so toast is visible before navigation
        setTimeout(() => {
          window.location.href = user.role === 'student' ? 'student.html' : 'tpo.html';
        }, 600);

      } catch (err) {
        errorTxt.textContent = err.message || 'Login failed. Please try again.';
        errorBox.classList.remove('hidden');
        btnText.textContent = 'Sign In';
        spinner.classList.add('hidden');
        form.querySelector('button[type="submit"]').disabled = false;
      }
    });
  };

  // ── Register Page Initialiser ────────────────────────────────────

  const initRegisterPage = () => {
    redirectIfAuthenticated();

    const form     = document.getElementById('register-form');
    const errBox   = document.getElementById('register-error');
    const errTxt   = document.getElementById('register-error-text');
    const btnText  = document.getElementById('register-btn-text');
    const spinner  = document.getElementById('register-spinner');

    if (!form) return;

    // Password strength indicator — jQuery event binding
    $('#reg-password').on('input', function () {
      const val = $(this).val();
      const strength = getPasswordStrength(val);
      const labels   = ['Too short', 'Weak', 'Medium', 'Strong'];
      const classes  = ['', 'weak', 'medium', 'strong'];

      $('#password-strength').toggleClass('hidden', val.length === 0);
      $('#strength-label').text(labels[strength] || '');

      [1, 2, 3].forEach((i) => {
        $(`#strength-${i}`)
          .removeClass('weak medium strong')
          .addClass(i <= strength ? classes[strength] : '');
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(form);

      const name     = document.getElementById('name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      // Validation
      let hasError = false;
      if (!name || name.length < 2) {
        showFieldError('name', 'Name must be at least 2 characters.');
        hasError = true;
      }
      if (!isValidEmail(email)) {
        showFieldError('reg-email', 'Please enter a valid email address.');
        hasError = true;
      }
      if (password.length < 6) {
        showFieldError('reg-password', 'Password must be at least 6 characters.');
        hasError = true;
      }
      if (hasError) return;

      btnText.textContent = 'Creating account...';
      spinner.classList.remove('hidden');
      form.querySelector('button[type="submit"]').disabled = true;
      errBox.classList.add('hidden');

      try {
        const response = await Portal.API.register(name, email, password);
        const { user, token } = response.data;
        saveSession(token, user);
        Portal.UI.showToast('Account created! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'student.html';
        }, 700);

      } catch (err) {
        errTxt.textContent = err.message || 'Registration failed. Please try again.';
        errBox.classList.remove('hidden');
        btnText.textContent = 'Create Account';
        spinner.classList.add('hidden');
        form.querySelector('button[type="submit"]').disabled = false;
      }
    });
  };

  // ── Public API ───────────────────────────────────────────────────
  return {
    initLoginPage,
    initRegisterPage,
    requireAuth,
    quickFill,
    logout,
    getUser,
    isAuthenticated,
  };

})();
