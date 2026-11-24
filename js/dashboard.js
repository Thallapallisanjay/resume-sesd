/**
 * Resume Builder - Dashboard Controller
 * Handles metrics calculation, recent resume listings, quick actions, and preview modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});

const Dashboard = {
  init() {
    Auth.requireAuth();
    this.renderHeader();
    this.renderStats();
    this.renderRecentResumes();
    this.renderScoreWidget();
    this.initQuickActions();
    this.initResumePreviewModal();
  },

  renderHeader() {
    const user = StorageManager.getCurrentUser();
    const welcomeName = document.getElementById('welcomeUserName');
    if (welcomeName && user) {
      welcomeName.textContent = user.name ? user.name.split(' ')[0] : 'Professional';
    }
  },

  renderStats() {
    const resumes = StorageManager.getResumes();
    const favorites = StorageManager.getFavorites();
    const downloads = StorageManager.getDownloadsCount();

    const totalResumesEl = document.getElementById('statTotalResumes');
    const totalFavoritesEl = document.getElementById('statFavoriteTemplates');
    const totalDownloadsEl = document.getElementById('statTotalDownloads');

    if (totalResumesEl) totalResumesEl.textContent = resumes.length;
    if (totalFavoritesEl) totalFavoritesEl.textContent = favorites.length;
    if (totalDownloadsEl) totalDownloadsEl.textContent = downloads;
  },

  renderRecentResumes() {
    const tableBody = document.getElementById('recentResumesTableBody');
    const emptyState = document.getElementById('recentResumesEmptyState');
    if (!tableBody) return;

    const resumes = StorageManager.getResumes();

    if (resumes.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Show top 4 recent resumes
    const recents = resumes.slice(0, 5);

    tableBody.innerHTML = recents.map(resume => {
      const formattedDate = App.formatDate(resume.updatedAt);
      const templateName = (resume.template || 'Modern').toUpperCase();
      const jobTitle = (resume.personal && resume.personal.jobTitle) || 'Software Professional';

      return `
        <tr>
          <td>
            <div class="table-resume-title">
              <div style="width: 34px; height: 34px; border-radius: 6px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                <i class="fa-solid fa-file-lines"></i>
              </div>
              <div>
                <a href="resume-builder.html?id=${resume.id}" style="font-weight: 700; color: var(--text-main);">${this.escapeHtml(resume.title || 'Untitled Resume')}</a>
                <div style="font-size: 0.775rem; color: var(--text-muted);">${this.escapeHtml(jobTitle)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="sidebar-badge" style="background: var(--bg-surface-alt); color: var(--primary); font-weight: 700;">
              ${templateName}
            </span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${formattedDate}</span>
          </td>
          <td>
            <div class="table-actions">
              <a href="resume-builder.html?id=${resume.id}" class="btn btn-outline btn-sm" title="Edit Resume">
                <i class="fa-solid fa-pen"></i> Edit
              </a>
              <button class="btn btn-secondary btn-sm preview-resume-btn" data-id="${resume.id}" title="Preview">
                <i class="fa-regular fa-eye"></i>
              </button>
              <button class="btn btn-secondary btn-sm duplicate-resume-btn" data-id="${resume.id}" title="Duplicate">
                <i class="fa-regular fa-copy"></i>
              </button>
              <button class="btn btn-secondary btn-sm delete-resume-btn" data-id="${resume.id}" title="Delete" style="color: var(--danger);">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.attachTableEvents();
  },

  renderScoreWidget() {
    const resumes = StorageManager.getResumes();
    const scoreVal = document.getElementById('atsScoreValue');
    const scoreStatus = document.getElementById('atsScoreStatus');
    const checklist = document.getElementById('atsChecklist');

    if (!scoreVal || resumes.length === 0) return;

    // Check strength of most recent resume
    const latest = resumes[0];
    let score = 50;

    const checks = [
      { name: 'Contact info & photo', done: !!(latest.personal && latest.personal.fullName && latest.personal.email) },
      { name: 'Professional summary (50+ words)', done: !!(latest.summary && latest.summary.length > 50) },
      { name: 'Education history listed', done: !!(latest.education && latest.education.length > 0) },
      { name: 'Work experience with bullet points', done: !!(latest.experience && latest.experience.length > 0) },
      { name: '5+ Core technical & soft skills', done: !!(latest.skills && latest.skills.length >= 5) },
      { name: 'Key projects with links', done: !!(latest.projects && latest.projects.length > 0) }
    ];

    const completedCount = checks.filter(c => c.done).length;
    score = Math.round((completedCount / checks.length) * 100);

    scoreVal.textContent = score;

    if (score >= 85) {
      if (scoreStatus) scoreStatus.textContent = 'Excellent ATS Score!';
    } else if (score >= 60) {
      if (scoreStatus) scoreStatus.textContent = 'Good – Minor additions recommended';
    } else {
      if (scoreStatus) scoreStatus.textContent = 'Needs Improvement';
    }

    if (checklist) {
      checklist.innerHTML = checks.map(c => `
        <div class="checklist-item ${c.done ? 'done' : 'pending'}">
          <i class="fa-solid ${c.done ? 'fa-circle-check' : 'fa-circle-dot'}"></i>
          <span>${c.name}</span>
        </div>
      `).join('');
    }
  },

  attachTableEvents() {
    // Delete Handlers
    document.querySelectorAll('.delete-resume-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const resume = StorageManager.getResumeById(id);
        const title = resume ? resume.title : 'this resume';

        App.showConfirmModal({
          title: 'Delete Resume?',
          message: `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
          confirmText: 'Delete Resume',
          confirmVariant: 'danger',
          onConfirm: () => {
            StorageManager.deleteResume(id);
            App.showToast('Resume deleted successfully.', 'success');
            Dashboard.renderStats();
            Dashboard.renderRecentResumes();
            Dashboard.renderScoreWidget();
          }
        });
      });
    });

    // Duplicate Handlers
    document.querySelectorAll('.duplicate-resume-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const duplicated = StorageManager.duplicateResume(id);
        if (duplicated) {
          App.showToast(`Duplicated "${duplicated.title}"`, 'success');
          Dashboard.renderStats();
          Dashboard.renderRecentResumes();
        }
      });
    });

    // Preview Handlers
    document.querySelectorAll('.preview-resume-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openPreviewModal(id);
      });
    });
  },

  initQuickActions() {
    // Import JSON Backup Action
    const importInput = document.getElementById('quickImportInput');
    const importBtn = document.getElementById('quickImportBtn');

    if (importBtn && importInput) {
      importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importAllData(event.target.result);
          if (res.success) {
            App.showToast('Data imported successfully!', 'success');
            setTimeout(() => window.location.reload(), 800);
          } else {
            App.showToast('Invalid backup file: ' + res.message, 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  },

  initResumePreviewModal() {
    let modal = document.getElementById('resumePreviewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'resumePreviewModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box modal-box-lg" style="max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title" id="previewModalTitle"><i class="fa-solid fa-eye text-primary"></i> Resume Preview</h3>
            <div class="flex items-center gap-1">
              <a href="#" id="previewModalEditBtn" class="btn btn-primary btn-sm"><i class="fa-solid fa-pen"></i> Edit</a>
              <button class="btn btn-outline btn-sm" id="previewModalPrintBtn"><i class="fa-solid fa-print"></i> Print</button>
              <button class="modal-close-btn" data-close-modal>&times;</button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y: auto; flex: 1; background: var(--bg-surface-alt); padding: 1.5rem; display: flex; justify-content: center;">
            <div id="previewModalContent" style="width: 100%; max-width: 700px; background: #fff; padding: 2.5rem; box-shadow: var(--shadow-lg); border-radius: 4px; color: #1e293b;">
              <!-- Rendered preview content -->
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.classList.remove('active'));
    }
  },

  openPreviewModal(id) {
    const resume = StorageManager.getResumeById(id);
    if (!resume) return;

    const modal = document.getElementById('resumePreviewModal');
    const titleEl = document.getElementById('previewModalTitle');
    const contentEl = document.getElementById('previewModalContent');
    const editBtn = document.getElementById('previewModalEditBtn');
    const printBtn = document.getElementById('previewModalPrintBtn');

    if (titleEl) titleEl.textContent = resume.title || 'Resume Preview';
    if (editBtn) editBtn.href = `resume-builder.html?id=${resume.id}`;

    if (printBtn) {
      printBtn.onclick = () => {
        window.open(`resume-builder.html?id=${resume.id}&print=true`, '_blank');
      };
    }

    if (contentEl) {
      const p = resume.personal || {};
      const expList = (resume.experience || []).map(exp => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px;">
            <span>${this.escapeHtml(exp.role || '')} – ${this.escapeHtml(exp.company || '')}</span>
            <span style="color: #64748b; font-size: 11px;">${exp.startDate || ''} - ${exp.current ? 'Present' : (exp.endDate || '')}</span>
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 4px; white-space: pre-line;">${this.escapeHtml(exp.description || '')}</div>
        </div>
      `).join('');

      const eduList = (resume.education || []).map(edu => `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px;">
            <span>${this.escapeHtml(edu.degree || '')} in ${this.escapeHtml(edu.branch || '')}</span>
            <span style="color: #64748b; font-size: 11px;">${edu.startYear || ''} - ${edu.endYear || ''}</span>
          </div>
          <div style="font-size: 12px; color: #475569;">${this.escapeHtml(edu.college || '')} ${edu.cgpa ? `• GPA: ${edu.cgpa}` : ''}</div>
        </div>
      `).join('');

      const skillList = (resume.skills || []).map(s => `
        <span style="display: inline-block; background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin: 2px;">
          ${this.escapeHtml(s.name)}
        </span>
      `).join('');

      contentEl.innerHTML = `
        <div style="border-bottom: 2px solid ${resume.themeColor || '#4f46e5'}; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${this.escapeHtml(p.fullName || 'Unnamed')}</h1>
          <h2 style="font-size: 14px; font-weight: 600; color: ${resume.themeColor || '#4f46e5'}; margin-bottom: 8px;">${this.escapeHtml(p.jobTitle || '')}</h2>
          <div style="font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 12px;">
            ${p.email ? `<span><i class="fa-regular fa-envelope"></i> ${this.escapeHtml(p.email)}</span>` : ''}
            ${p.phone ? `<span><i class="fa-solid fa-phone"></i> ${this.escapeHtml(p.phone)}</span>` : ''}
            ${p.address ? `<span><i class="fa-solid fa-location-dot"></i> ${this.escapeHtml(p.address)}</span>` : ''}
            ${p.linkedin ? `<span><i class="fa-brands fa-linkedin"></i> ${this.escapeHtml(p.linkedin)}</span>` : ''}
          </div>
        </div>

        ${resume.summary ? `
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Summary</h3>
            <p style="font-size: 12.5px; line-height: 1.5; color: #334155;">${this.escapeHtml(resume.summary)}</p>
          </div>
        ` : ''}

        ${expList ? `
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">Experience</h3>
            ${expList}
          </div>
        ` : ''}

        ${eduList ? `
          <div style="margin-bottom: 18px;">
            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">Education</h3>
            ${eduList}
          </div>
        ` : ''}

        ${skillList ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Skills</h3>
            <div>${skillList}</div>
          </div>
        ` : ''}
      `;
    }

    modal.classList.add('active');
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
