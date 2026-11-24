/**
 * Resume Builder - Authentication Module
 * Handles login, registration, password validation, strength meters, and auth guards.
 */

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

const Auth = {
  init() {
    this.initPasswordToggles();
    this.initLoginForm();
    this.initRegisterForm();
    this.initForgotPassword();
    this.initDemoLogin();
  },

  // --- Password Visibility Toggle ---
  initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-target');
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');

        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            if (icon) {
              icon.classList.remove('fa-eye');
              icon.classList.add('fa-eye-slash');
            }
          } else {
            input.type = 'password';
            if (icon) {
              icon.classList.remove('fa-eye-slash');
              icon.classList.add('fa-eye');
            }
          }
        }
      });
    });
  },

  // --- Demo Login Button ---
  initDemoLogin() {
    const demoBtns = document.querySelectorAll('.demo-login-btn, #demoLoginBtn');
    demoBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        if (emailInput && passInput) {
          emailInput.value = 'alex.morgan@example.com';
          passInput.value = 'Password123';
          App.showToast('Demo credentials autofilled!', 'info', 2000);
          setTimeout(() => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.requestSubmit();
          }, 300);
        } else {
          // Direct login
          const res = StorageManager.loginUser('alex.morgan@example.com', 'Password123');
          if (res.success) {
            App.showToast('Logged in as Alex Morgan (Demo)!', 'success');
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 600);
          }
        }
      });
    });
  },

  // --- Login Form Logic ---
  initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // Check if remember me was previously stored
    const rememberedEmail = localStorage.getItem('rb_remembered_email');
    if (rememberedEmail) {
      const emailInput = document.getElementById('loginEmail');
      const rememberCheckbox = document.getElementById('rememberMe');
      if (emailInput) emailInput.value = rememberedEmail;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const rememberCheckbox = document.getElementById('rememberMe');
      const submitBtn = form.querySelector('button[type="submit"]');

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validation
      let isValid = true;
      this.clearError(emailInput);
      this.clearError(passwordInput);

      if (!email) {
        this.showError(emailInput, 'Email address is required.');
        isValid = false;
      } else if (!this.isValidEmail(email)) {
        this.showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      }

      if (!password) {
        this.showError(passwordInput, 'Password is required.');
        isValid = false;
      }

      if (!isValid) return;

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

      setTimeout(() => {
        const result = StorageManager.loginUser(email, password);

        if (result.success) {
          // Handle Remember Me
          if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('rb_remembered_email', email);
          } else {
            localStorage.removeItem('rb_remembered_email');
          }

          App.showToast(`Welcome back, ${result.user.name}!`, 'success', 2500);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
          this.showError(passwordInput, result.message || 'Invalid credentials.');
          App.showToast(result.message || 'Invalid credentials.', 'error');
        }
      }, 500);
    });
  },

  // --- Registration Form Logic ---
  initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirmPassword');
    const strengthMeter = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');

    // Real-time password strength
    if (passwordInput && strengthMeter) {
      passwordInput.addEventListener('input', () => {
        const pwd = passwordInput.value;
        const score = this.calculatePasswordStrength(pwd);
        this.renderPasswordStrength(score, strengthMeter, strengthText);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      const termsCheckbox = document.getElementById('acceptTerms');
      const submitBtn = form.querySelector('button[type="submit"]');

      let isValid = true;
      this.clearError(nameInput);
      this.clearError(emailInput);
      this.clearError(passwordInput);
      this.clearError(confirmInput);

      if (!name) {
        this.showError(nameInput, 'Full name is required.');
        isValid = false;
      }

      if (!email) {
        this.showError(emailInput, 'Email address is required.');
        isValid = false;
      } else if (!this.isValidEmail(email)) {
        this.showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      }

      if (!password) {
        this.showError(passwordInput, 'Password is required.');
        isValid = false;
      } else if (password.length < 8) {
        this.showError(passwordInput, 'Password must be at least 8 characters long.');
        isValid = false;
      }

      if (password !== confirm) {
        this.showError(confirmInput, 'Passwords do not match.');
        isValid = false;
      }

      if (termsCheckbox && !termsCheckbox.checked) {
        App.showToast('Please accept the Terms of Service to continue.', 'warning');
        isValid = false;
      }

      if (!isValid) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

      setTimeout(() => {
        const result = StorageManager.registerUser({ name, email, password });

        if (result.success) {
          App.showToast('Account created successfully! Redirecting to Dashboard...', 'success', 3000);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Free Account';
          this.showError(emailInput, result.message);
          App.showToast(result.message, 'error');
        }
      }, 600);
    });
  },

  // --- Forgot Password Demo Modal ---
  initForgotPassword() {
    const forgotLinks = document.querySelectorAll('.forgot-password-link, #forgotPasswordLink');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const forgotForm = document.getElementById('forgotPasswordForm');

    forgotLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (forgotModal) {
          forgotModal.classList.add('active');
        } else {
          App.showConfirmModal({
            title: 'Password Reset Demo',
            message: 'In this frontend prototype, enter your registered email to reset your credentials to default (Password123).',
            confirmText: 'Reset Password',
            onConfirm: () => {
              App.showToast('Password reset link sent to your email (simulated)!', 'success');
            }
          });
        }
      });
    });

    if (forgotForm && forgotModal) {
      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        if (!email || !this.isValidEmail(email)) {
          App.showToast('Please provide a valid email address.', 'warning');
          return;
        }

        forgotModal.classList.remove('active');
        App.showToast(`Password reset link sent to ${email} (Demo simulated).`, 'success', 4000);
      });
    }
  },

  // --- Helpers ---
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  calculatePasswordStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 20;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    return Math.min(score, 100);
  },

  renderPasswordStrength(score, meterEl, textEl) {
    meterEl.style.width = `${score}%`;
    let color = '#ef4444';
    let text = 'Too short';

    if (score >= 80) {
      color = '#10b981';
      text = 'Strong password';
    } else if (score >= 50) {
      color = '#f59e0b';
      text = 'Medium strength';
    } else if (score > 0) {
      color = '#ef4444';
      text = 'Weak password';
    } else {
      text = '';
    }

    meterEl.style.backgroundColor = color;
    if (textEl) {
      textEl.textContent = text;
      textEl.style.color = color;
    }
  },

  showError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    const parent = inputElement.closest('.form-group');
    if (parent) {
      let feedback = parent.querySelector('.invalid-feedback');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        parent.appendChild(feedback);
      }
      feedback.textContent = message;
      feedback.style.display = 'block';
    }
  },

  clearError(inputElement) {
    inputElement.classList.remove('is-invalid');
    const parent = inputElement.closest('.form-group');
    if (parent) {
      const feedback = parent.querySelector('.invalid-feedback');
      if (feedback) feedback.style.display = 'none';
    }
  },

  // Route guard for authenticated pages
  requireAuth() {
    const user = StorageManager.getCurrentUser();
    if (!user) {
      // Auto-fallback to demo user or redirect
      const users = StorageManager.getUsers();
      if (users.length > 0) {
        StorageManager.setCurrentUser(users[0]);
      } else {
        window.location.href = 'login.html';
      }
    }
  }
};
