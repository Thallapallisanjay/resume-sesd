/**
 * Resume Builder - My Resumes Page Controller
 * Handles resume grid display, searching, sorting, filtering, cloning, deletion, and preview modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  MyResumesController.init();
});

const MyResumesController = {
  searchQuery: '',
  sortBy: 'updated-desc',
  filterTemplate: 'all',

  init() {
    Auth.requireAuth();
    this.renderResumes();
    this.initControls();
    this.initPreviewModal();
  },

  renderResumes() {
    const grid = document.getElementById('myResumesGrid');
    const emptyState = document.getElementById('myResumesEmptyState');
    const countBadge = document.getElementById('resumesCountBadge');
    if (!grid) return;

    let resumes = StorageManager.getResumes();

    // Filter by search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      resumes = resumes.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.personal && r.personal.jobTitle && r.personal.jobTitle.toLowerCase().includes(q))
      );
    }

    // Filter by template
    if (this.filterTemplate !== 'all') {
      resumes = resumes.filter(r => (r.template || 'modern') === this.filterTemplate);
    }

    // Sort
    resumes.sort((a, b) => {
      if (this.sortBy === 'updated-desc') {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      } else if (this.sortBy === 'updated-asc') {
        return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      } else if (this.sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (this.sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

    if (countBadge) countBadge.textContent = `${resumes.length} ${resumes.length === 1 ? 'Resume' : 'Resumes'}`;

    if (resumes.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Render cards + Create New card
    let html = `
      <!-- Create New Resume Card -->
      <a href="resume-builder.html?new=true" class="resume-card" style="border: 2px dashed var(--border-color); background: var(--bg-surface-alt); align-items: center; justify-content: center; min-height: 280px; text-decoration: none; cursor: pointer; transition: all var(--transition-normal);">
        <div style="text-align: center; padding: 2rem;">
          <div style="width: 58px; height: 58px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem;">
            <i class="fa-solid fa-plus"></i>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">Create New Resume</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Start from scratch or use AI assistant</p>
        </div>
      </a>
    `;

    html += resumes.map(r => {
      const p = r.personal || {};
      const templateName = (r.template || 'Modern').toUpperCase();
      const updatedFormatted = App.formatDate(r.updatedAt);
      const accent = r.themeColor || '#4f46e5';

      return `
        <div class="resume-card">
          <div class="resume-card-thumb">
            <div class="resume-thumb-paper">
              <div style="background: ${accent}; height: 4px; width: 100%; margin-bottom: 6px;"></div>
              <p style="font-weight: bold; font-size: 6px; color: #0f172a;">${this.escapeHtml(p.fullName || 'Alex Morgan')}</p>
              <p style="color: ${accent}; font-size: 4px; margin-bottom: 4px;">${this.escapeHtml(p.jobTitle || 'Engineer')}</p>
              <div style="height: 2px; background: #cbd5e1; margin-bottom: 2px; width: 90%;"></div>
              <div style="height: 2px; background: #e2e8f0; margin-bottom: 2px; width: 75%;"></div>
              <div style="height: 2px; background: #e2e8f0; margin-bottom: 2px; width: 85%;"></div>
            </div>

            <div class="resume-card-overlay">
              <a href="resume-builder.html?id=${r.id}" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-pen"></i> Edit
              </a>
              <button class="btn btn-secondary btn-sm preview-btn" data-id="${r.id}" title="Preview">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="resume-card-body">
            <div class="flex justify-between items-center" style="margin-bottom: 0.25rem;">
              <h3 class="resume-card-title" title="${this.escapeHtml(r.title || 'Untitled Resume')}">${this.escapeHtml(r.title || 'Untitled Resume')}</h3>
            </div>
            <div class="resume-card-date">
              <i class="fa-regular fa-clock"></i> Modified ${updatedFormatted}
            </div>

            <div class="resume-card-footer">
              <span class="sidebar-badge" style="background: var(--bg-surface-alt); color: var(--primary); font-size: 0.725rem; font-weight: 700;">
                ${templateName}
              </span>

              <div class="flex gap-1">
                <button class="btn btn-ghost btn-sm duplicate-btn" data-id="${r.id}" title="Duplicate Resume">
                  <i class="fa-regular fa-copy"></i>
                </button>
                <button class="btn btn-ghost btn-sm print-direct-btn" data-id="${r.id}" title="Download PDF / Print">
                  <i class="fa-solid fa-download"></i>
                </button>
                <button class="btn btn-ghost btn-sm delete-btn" data-id="${r.id}" title="Delete Resume" style="color: var(--danger);">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;
    this.attachCardEvents();
  },

  attachCardEvents() {
    // Delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const resume = StorageManager.getResumeById(id);
        const title = resume ? resume.title : 'this resume';

        App.showConfirmModal({
          title: 'Delete Resume?',
          message: `Are you sure you want to permanently delete "${title}"? This cannot be undone.`,
          confirmText: 'Delete Resume',
          confirmVariant: 'danger',
          onConfirm: () => {
            StorageManager.deleteResume(id);
            App.showToast('Resume deleted successfully.', 'success');
            MyResumesController.renderResumes();
          }
        });
      });
    });

    // Duplicate
    document.querySelectorAll('.duplicate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const dup = StorageManager.duplicateResume(id);
        if (dup) {
          App.showToast(`Duplicated "${dup.title}"`, 'success');
          MyResumesController.renderResumes();
        }
      });
    });

    // Preview
    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        this.openPreview(id);
      });
    });

    // Direct Print
    document.querySelectorAll('.print-direct-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        StorageManager.incrementDownloadCount();
        window.open(`resume-builder.html?id=${id}&print=true`, '_blank');
      });
    });
  },

  initControls() {
    const searchInput = document.getElementById('searchResumesInput');
    const sortSelect = document.getElementById('sortResumesSelect');
    const filterSelect = document.getElementById('filterTemplateSelect');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderResumes();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderResumes();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterTemplate = e.target.value;
        this.renderResumes();
      });
    }
  },

  initPreviewModal() {
    let modal = document.getElementById('myResumePreviewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'myResumePreviewModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box modal-box-lg" style="max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title" id="myResumePreviewTitle"></h3>
            <div class="flex items-center gap-1">
              <a href="#" id="myResumePreviewEditBtn" class="btn btn-primary btn-sm"><i class="fa-solid fa-pen"></i> Edit</a>
              <button class="btn btn-outline btn-sm" id="myResumePreviewPrintBtn"><i class="fa-solid fa-print"></i> Print</button>
              <button class="modal-close-btn" data-close-modal>&times;</button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y: auto; flex: 1; background: var(--bg-surface-alt); padding: 1.5rem; display: flex; justify-content: center;">
            <div id="myResumePreviewContent" style="width: 100%; max-width: 680px; background: #fff; padding: 2.5rem; box-shadow: var(--shadow-lg); border-radius: 4px; color: #1e293b;">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.classList.remove('active'));
    }
  },

  openPreview(id) {
    const resume = StorageManager.getResumeById(id);
    if (!resume) return;

    const modal = document.getElementById('myResumePreviewModal');
    const titleEl = document.getElementById('myResumePreviewTitle');
    const editBtn = document.getElementById('myResumePreviewEditBtn');
    const printBtn = document.getElementById('myResumePreviewPrintBtn');
    const contentEl = document.getElementById('myResumePreviewContent');

    if (titleEl) titleEl.textContent = resume.title || 'Resume Preview';
    if (editBtn) editBtn.href = `resume-builder.html?id=${resume.id}`;

    if (printBtn) {
      printBtn.onclick = () => {
        StorageManager.incrementDownloadCount();
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
        <div style="border-bottom: 2px solid ${resume.themeColor || '#4f46e5'}; padding-bottom: 16px; margin-bottom: 18px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${this.escapeHtml(p.fullName || 'Unnamed')}</h1>
          <h2 style="font-size: 14px; font-weight: 600; color: ${resume.themeColor || '#4f46e5'}; margin-bottom: 8px;">${this.escapeHtml(p.jobTitle || '')}</h2>
          <div style="font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 12px;">
            ${p.email ? `<span>${this.escapeHtml(p.email)}</span>` : ''}
            ${p.phone ? `<span>${this.escapeHtml(p.phone)}</span>` : ''}
            ${p.address ? `<span>${this.escapeHtml(p.address)}</span>` : ''}
          </div>
        </div>

        ${resume.summary ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">Summary</h3>
            <p style="font-size: 12px; line-height: 1.5; color: #334155;">${this.escapeHtml(resume.summary)}</p>
          </div>
        ` : ''}

        ${expList ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Experience</h3>
            ${expList}
          </div>
        ` : ''}

        ${eduList ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Education</h3>
            ${eduList}
          </div>
        ` : ''}

        ${skillList ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${resume.themeColor || '#4f46e5'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">Skills</h3>
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
