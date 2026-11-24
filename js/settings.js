/**
 * Resume Builder - Settings Controller
 * Handles user profile editing, avatar upload, theme settings, security, and JSON data backup/restore.
 */

document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
});

const Settings = {
  init() {
    Auth.requireAuth();
    this.initTabs();
    this.populateUserData();
    this.initAvatarUpload();
    this.initProfileForm();
    this.initAppearanceForm();
    this.initSecurityForm();
    this.initDataBackup();
  },

  initTabs() {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const tabPanes = document.querySelectorAll('.settings-tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const pane = document.getElementById(targetId);
        if (pane) pane.classList.add('active');
      });
    });
  },

  populateUserData() {
    const user = StorageManager.getCurrentUser();
    if (!user) return;

    const nameInput = document.getElementById('settingsFullName');
    const emailInput = document.getElementById('settingsEmail');
    const titleInput = document.getElementById('settingsJobTitle');
    const phoneInput = document.getElementById('settingsPhone');
    const locationInput = document.getElementById('settingsLocation');
    const bioInput = document.getElementById('settingsBio');
    const avatarImg = document.getElementById('settingsAvatarImg');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (titleInput) titleInput.value = user.jobTitle || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (locationInput) locationInput.value = user.location || '';
    if (bioInput) bioInput.value = user.bio || '';

    if (avatarImg && user.avatar) {
      avatarImg.src = user.avatar;
    }

    // Appearance
    const currentTheme = StorageManager.getTheme();
    const themeSelect = document.getElementById('settingsThemeSelect');
    if (themeSelect) themeSelect.value = currentTheme;
  },

  initAvatarUpload() {
    const avatarInput = document.getElementById('avatarFileInput');
    const avatarImg = document.getElementById('settingsAvatarImg');
    const removeBtn = document.getElementById('removeAvatarBtn');
    const uploadTrigger = document.getElementById('uploadAvatarTrigger');

    if (uploadTrigger && avatarInput) {
      uploadTrigger.addEventListener('click', () => avatarInput.click());
    }

    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          App.showToast('Image size should be less than 2MB', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          if (avatarImg) avatarImg.src = base64;
          StorageManager.updateUserProfile({ avatar: base64 });
          App.updateUserNavDisplay();
          App.showToast('Profile photo updated!', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
        if (avatarImg) avatarImg.src = defaultAvatar;
        StorageManager.updateUserProfile({ avatar: defaultAvatar });
        App.updateUserNavDisplay();
        App.showToast('Avatar reset to default.', 'info');
      });
    }
  },

  initProfileForm() {
    const form = document.getElementById('profileSettingsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('settingsFullName').value.trim();
      const email = document.getElementById('settingsEmail').value.trim();
      const jobTitle = document.getElementById('settingsJobTitle').value.trim();
      const phone = document.getElementById('settingsPhone').value.trim();
      const location = document.getElementById('settingsLocation').value.trim();
      const bio = document.getElementById('settingsBio').value.trim();

      if (!name) {
        App.showToast('Full name is required.', 'warning');
        return;
      }
      if (!email) {
        App.showToast('Email address is required.', 'warning');
        return;
      }

      const res = StorageManager.updateUserProfile({
        name,
        email,
        jobTitle,
        phone,
        location,
        bio
      });

      if (res.success) {
        App.showToast('Profile information saved successfully!', 'success');
        App.updateUserNavDisplay();
      } else {
        App.showToast(res.message || 'Error updating profile.', 'error');
      }
    });

    const resetBtn = document.getElementById('resetProfileBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.populateUserData();
        App.showToast('Form reset to saved values.', 'info');
      });
    }
  },

  initAppearanceForm() {
    const themeSelect = document.getElementById('settingsThemeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const selected = themeSelect.value;
        StorageManager.setTheme(selected);
        App.applyTheme(selected);
        App.showToast(`Applied ${selected} theme.`, 'info');
      });
    }

    // Color Swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.getAttribute('data-color');
        document.documentElement.style.setProperty('--primary', color);
        App.showToast(`Primary theme color set to ${color}`, 'success');
      });
    });
  },

  initSecurityForm() {
    const form = document.getElementById('securitySettingsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('currentPassword').value;
      const newPwd = document.getElementById('newPassword').value;
      const confirmPwd = document.getElementById('confirmNewPassword').value;

      const user = StorageManager.getCurrentUser();

      if (currentPwd !== user.password) {
        App.showToast('Current password does not match.', 'error');
        return;
      }

      if (newPwd.length < 8) {
        App.showToast('New password must be at least 8 characters long.', 'warning');
        return;
      }

      if (newPwd !== confirmPwd) {
        App.showToast('New passwords do not match.', 'warning');
        return;
      }

      StorageManager.updateUserProfile({ password: newPwd });
      form.reset();
      App.showToast('Password updated successfully!', 'success');
    });
  },

  initDataBackup() {
    // Export Backup JSON
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const jsonStr = StorageManager.exportAllData();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_builder_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showToast('Backup downloaded successfully!', 'success');
      });
    }

    // Import Backup JSON
    const importInput = document.getElementById('importBackupInput');
    const importBtn = document.getElementById('importBackupBtn');

    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());

      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importAllData(event.target.result);
          if (res.success) {
            App.showToast('Backup imported successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 900);
          } else {
            App.showToast('Import failed: ' + res.message, 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Factory Reset
    const resetDataBtn = document.getElementById('factoryResetBtn');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        App.showConfirmModal({
          title: 'Reset All Data?',
          message: 'This will reset all resumes, bookmarks, and user profiles back to factory sample defaults. Are you sure?',
          confirmText: 'Reset to Defaults',
          confirmVariant: 'danger',
          onConfirm: () => {
            StorageManager.resetToDefaults();
            App.showToast('Application reset to default state.', 'info');
            setTimeout(() => window.location.reload(), 900);
          }
        });
      });
    }
  }
};
