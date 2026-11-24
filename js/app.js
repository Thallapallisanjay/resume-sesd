/**
 * Resume Builder - Core Application Logic
 * Shared utilities, Toast alerts, Modals, Theme management, and Navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  init() {
    this.initTheme();
    this.initNavbar();
    this.initModals();
    this.initSidebar();
    this.updateUserNavDisplay();
  },

  // --- Theme Management ---
  initTheme() {
    const savedTheme = StorageManager.getTheme();
    this.applyTheme(savedTheme);

    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn, #sidebarThemeToggle');
    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        StorageManager.setTheme(newTheme);
        App.showToast(`Switched to ${newTheme} mode`, 'info', 2000);
      });
    });
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcons = document.querySelectorAll('.theme-toggle-icon, #themeIcon');
    themeIcons.forEach(icon => {
      if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    });

    const themeTexts = document.querySelectorAll('.theme-toggle-text');
    themeTexts.forEach(txt => {
      txt.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  },

  // --- Navbar & Mobile Menu ---
  initNavbar() {
    const hamburgerBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (hamburgerBtn && navLinks) {
      hamburgerBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburgerBtn.querySelector('i');
        if (icon) {
          if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
          } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
          }
        }
      });

      // Close menu on link click
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const icon = hamburgerBtn.querySelector('i');
            if (icon) {
              icon.classList.remove('fa-xmark');
              icon.classList.add('fa-bars');
            }
          }
        });
      });
    }

    // Sticky Navbar shadow on scroll
    const navbar = document.querySelector('.site-header, .navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }
  },

  // --- Sidebar Collapse & Mobile Drawer ---
  initSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const sidebarToggle = document.getElementById('sidebarToggleBtn');
    const sidebarClose = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
      });
    }

    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      });
    }

    if (sidebarOverlay && sidebar) {
      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
    }
  },

  // --- User Profile Navigation Display ---
  updateUserNavDisplay() {
    const currentUser = StorageManager.getCurrentUser();

    // Update Topbar / Navbar user items
    const userAvatars = document.querySelectorAll('.current-user-avatar');
    const userNames = document.querySelectorAll('.current-user-name');
    const userEmails = document.querySelectorAll('.current-user-email');
    const authActions = document.querySelectorAll('.auth-actions-group');
    const userDropdowns = document.querySelectorAll('.user-profile-dropdown');

    if (currentUser) {
      userAvatars.forEach(img => {
        if (currentUser.avatar) {
          img.src = currentUser.avatar;
          img.style.display = 'block';
        }
      });
      userNames.forEach(el => {
        el.textContent = currentUser.name || 'User';
      });
      userEmails.forEach(el => {
        el.textContent = currentUser.email || '';
      });

      authActions.forEach(el => {
        // If on public home, can show "Go to Dashboard" button instead of Login/Register
        el.innerHTML = `
          <a href="dashboard.html" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-gauge-high"></i> Dashboard
          </a>
        `;
      });
    } else {
      authActions.forEach(el => {
        el.innerHTML = `
          <a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>
          <a href="register.html" class="btn btn-primary btn-sm">Get Started Free</a>
        `;
      });
    }

    // Attach Logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn, #logoutBtn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        App.showConfirmModal({
          title: 'Sign Out Confirmation',
          message: 'Are you sure you want to sign out of your account?',
          confirmText: 'Sign Out',
          confirmVariant: 'danger',
          onConfirm: () => {
            StorageManager.logoutUser();
            App.showToast('You have been signed out successfully.', 'info');
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 800);
          }
        });
      });
    });
  },

  // --- Toast Notification System ---
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-content">
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
      <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.remove('visible');
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);

    const timer = setTimeout(dismiss, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
  },

  // --- Modal Dialog System ---
  initModals() {
    // Backdrop close for static modals
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
      }
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
      });
    });
  },

  showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'primary', onConfirm }) {
    let modal = document.getElementById('dynamicConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'dynamicConfirmModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box modal-box-sm">
          <div class="modal-header">
            <h3 class="modal-title" id="confirmModalTitle"></h3>
            <button class="modal-close-btn" data-close-confirm>&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirmModalMessage" class="text-secondary"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="confirmModalCancelBtn">Cancel</button>
            <button class="btn" id="confirmModalActionBtn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('[data-close-confirm]').addEventListener('click', () => modal.classList.remove('active'));
      modal.querySelector('#confirmModalCancelBtn').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    const titleEl = modal.querySelector('#confirmModalTitle');
    const msgEl = modal.querySelector('#confirmModalMessage');
    const actionBtn = modal.querySelector('#confirmModalActionBtn');
    const cancelBtn = modal.querySelector('#confirmModalCancelBtn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    actionBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // Reset classes
    actionBtn.className = `btn btn-${confirmVariant}`;

    // Remove previous click handlers
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

    newActionBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      if (typeof onConfirm === 'function') onConfirm();
    });

    modal.classList.add('active');
  },

  // --- Utility: Time Ago Formatter ---
  formatDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};
