/**
 * Resume Builder - Templates Gallery Controller
 * Defines 10 resume templates, filtering, search, favorite toggling, and full preview modal.
 */

const TEMPLATES_CATALOG = [
  {
    id: 'modern',
    name: 'Modern',
    category: 'popular',
    description: 'Clean two-column layout with sidebar and elegant accents. Ideal for tech, marketing, and modern business roles.',
    badge: 'Popular',
    accent: '#4f46e5',
    tags: ['Tech', 'SaaS', 'Marketing', '2-Column']
  },
  {
    id: 'ats',
    name: 'ATS Friendly',
    category: 'ats',
    description: 'Single-column high parsing score layout with clear standard headers. Maximizes compatibility with corporate ATS software.',
    badge: 'High ATS Score',
    accent: '#0f172a',
    tags: ['ATS', 'Corporate', 'Single Column', 'Recruiter Choice']
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'creative',
    description: 'Bold header banner, vibrant color tags, and portfolio-first structure for designers, writers, and artists.',
    badge: 'Creative',
    accent: '#ec4899',
    tags: ['Design', 'UI/UX', 'Portfolio', 'Vibrant']
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'executive',
    description: 'Sophisticated serif typography with milestone-driven leadership achievements and core competencies.',
    badge: 'Leadership',
    accent: '#0f766e',
    tags: ['Leadership', 'Management', 'C-Level', 'Serif']
  },
  {
    id: 'student',
    name: 'Student',
    category: 'student',
    description: 'Education-first structure highlighting coursework, GPA, university leadership, and academic projects.',
    badge: 'Academic',
    accent: '#2563eb',
    tags: ['College', 'Graduates', 'Coursework', 'Internship']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    category: 'minimal',
    description: 'Scandinavian-style ultra clean monochrome aesthetic with generous whitespace and refined typography.',
    badge: 'Clean',
    accent: '#475569',
    tags: ['Minimalist', 'Monochrome', 'Elegant', 'Clean']
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'creative',
    description: 'Navy and warm gold tones with stylish section dividers and timeline markers for luxury and consulting.',
    badge: 'Premium',
    accent: '#d97706',
    tags: ['Consulting', 'Finance', 'Luxury', 'Timeline']
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'professional',
    description: 'Standard corporate two-column format trusted by Fortune 500 recruiters for mid to senior professionals.',
    badge: 'Standard',
    accent: '#0284c7',
    tags: ['Business', 'Finance', 'Operations', 'Standard']
  },
  {
    id: 'corporate',
    name: 'Corporate',
    category: 'professional',
    description: 'Structured border blocks with clear KPI metrics styling, ideal for enterprise and operations leaders.',
    badge: 'Enterprise',
    accent: '#4338ca',
    tags: ['Enterprise', 'Operations', 'KPI-Driven']
  },
  {
    id: 'fresher',
    name: 'Fresher',
    category: 'student',
    description: 'Skills, personal projects, and certifications focused layout tailored for entry-level career starters.',
    badge: 'Entry Level',
    accent: '#059669',
    tags: ['Entry Level', 'Projects', 'Certifications', 'Skills']
  }
];

document.addEventListener('DOMContentLoaded', () => {
  TemplatesController.init();
});

const TemplatesController = {
  currentCategory: 'all',
  searchQuery: '',

  init() {
    this.renderTemplates();
    this.initFilters();
    this.initSearch();
    this.initModal();
  },

  renderTemplates() {
    const grid = document.getElementById('templatesGrid');
    const emptyState = document.getElementById('templatesEmptyState');
    if (!grid) return;

    let filtered = TEMPLATES_CATALOG.filter(tmpl => {
      const matchesSearch = tmpl.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            tmpl.tags.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                            tmpl.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      if (this.currentCategory === 'all') return matchesSearch;
      if (this.currentCategory === 'favorites') return matchesSearch && StorageManager.isFavorite(tmpl.id);
      return matchesSearch && tmpl.category === this.currentCategory;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(tmpl => {
      const isFav = StorageManager.isFavorite(tmpl.id);
      return `
        <div class="template-card">
          <div class="template-preview-frame">
            <div class="template-mini-paper">
              <div style="background: ${tmpl.accent}; height: 6px; width: 100%; margin-bottom: 8px; border-radius: 2px;"></div>
              <p style="font-weight: 800; font-size: 8px; color: #0f172a;">${tmpl.name.toUpperCase()}</p>
              <p style="color: ${tmpl.accent}; font-size: 5px; font-weight: 600;">${tmpl.badge}</p>
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                <div style="height: 3px; background: #cbd5e1; margin-bottom: 3px; width: 85%;"></div>
                <div style="height: 3px; background: #e2e8f0; margin-bottom: 3px; width: 95%;"></div>
                <div style="height: 3px; background: #e2e8f0; margin-bottom: 3px; width: 70%;"></div>
              </div>
              <div style="margin-top: 8px;">
                <div style="display: flex; gap: 2px; flex-wrap: wrap;">
                  ${tmpl.tags.slice(0, 3).map(tag => `<span style="font-size: 4px; background: #f1f5f9; padding: 1px 3px; border-radius: 2px;">${tag}</span>`).join('')}
                </div>
              </div>
            </div>

            <div class="template-card-overlay">
              <a href="resume-builder.html?template=${tmpl.id}" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Use Template
              </a>
              <button class="btn btn-secondary btn-sm preview-template-btn" data-id="${tmpl.id}">
                <i class="fa-regular fa-eye"></i> Preview
              </button>
            </div>
          </div>

          <div class="template-info">
            <div>
              <div class="template-title">${tmpl.name}</div>
              <span class="template-tag">${tmpl.badge}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${tmpl.id}" title="Bookmark Template">
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.attachEvents();
  },

  attachEvents() {
    // Favorite Toggle
    document.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        StorageManager.toggleFavorite(id);
        btn.classList.toggle('active');
        App.showToast(`Template ${id} ${btn.classList.contains('active') ? 'bookmarked' : 'unbookmarked'}`, 'info', 2000);
      });
    });

    // Preview Template Button
    document.querySelectorAll('.preview-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        this.openPreview(id);
      });
    });
  },

  initFilters() {
    const filterBtns = document.querySelectorAll('.filter-pill-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.getAttribute('data-category');
        this.renderTemplates();
      });
    });
  },

  initSearch() {
    const searchInput = document.getElementById('templateSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderTemplates();
      });
    }
  },

  initModal() {
    let modal = document.getElementById('templateModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'templateModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box modal-box-lg" style="max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title" id="tmplModalTitle"></h3>
            <div class="flex items-center gap-1">
              <a href="#" id="tmplModalUseBtn" class="btn btn-primary btn-sm">Use This Template</a>
              <button class="modal-close-btn" data-close-modal>&times;</button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y: auto; flex: 1; background: var(--bg-surface-alt); padding: 1.5rem; display: flex; justify-content: center;">
            <div id="tmplModalBody" style="width: 100%; max-width: 650px; background: #fff; padding: 2.5rem; box-shadow: var(--shadow-lg); border-radius: 4px; color: #1e293b;">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.classList.remove('active'));
    }
  },

  openPreview(templateId) {
    const tmpl = TEMPLATES_CATALOG.find(t => t.id === templateId);
    if (!tmpl) return;

    const modal = document.getElementById('templateModal');
    const titleEl = document.getElementById('tmplModalTitle');
    const useBtn = document.getElementById('tmplModalUseBtn');
    const bodyEl = document.getElementById('tmplModalBody');

    if (titleEl) titleEl.textContent = `${tmpl.name} Template Preview`;
    if (useBtn) useBtn.href = `resume-builder.html?template=${tmpl.id}`;

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="border-bottom: 2px solid ${tmpl.accent}; padding-bottom: 16px; margin-bottom: 18px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">ALEX MORGAN</h1>
          <h2 style="font-size: 14px; font-weight: 600; color: ${tmpl.accent}; margin-bottom: 8px;">Senior Full Stack Engineer</h2>
          <div style="font-size: 11.5px; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap;">
            <span>alex.morgan@example.com</span>
            <span>+1 (555) 234-5678</span>
            <span>San Francisco, CA</span>
            <span>linkedin.com/in/alexmorgan-dev</span>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${tmpl.accent}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Professional Summary</h3>
          <p style="font-size: 12px; line-height: 1.5; color: #334155;">
            Accomplished Senior Full Stack Engineer with 6+ years building fault-tolerant distributed web applications and high-velocity cloud systems. Expert in TypeScript, React, and Node.js.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${tmpl.accent}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Experience</h3>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 12.5px;">
              <span>Senior Full Stack Engineer – CloudScale Tech</span>
              <span style="color: #64748b; font-size: 11px;">Jan 2023 - Present</span>
            </div>
            <p style="font-size: 11.5px; color: #475569; margin-top: 4px;">• Architected scalable microservices handling 12M+ monthly queries.<br>• Boosted Core Web Vitals resulting in 42% faster load times.</p>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${tmpl.accent}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Education</h3>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 12.5px;">
            <span>B.S. in Computer Science – UC Berkeley</span>
            <span style="color: #64748b; font-size: 11px;">2016 - 2020</span>
          </div>
        </div>

        <div>
          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${tmpl.accent}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Skills</h3>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <span style="background: #f1f5f9; padding: 2px 6px; font-size: 11px; border-radius: 4px;">React</span>
            <span style="background: #f1f5f9; padding: 2px 6px; font-size: 11px; border-radius: 4px;">TypeScript</span>
            <span style="background: #f1f5f9; padding: 2px 6px; font-size: 11px; border-radius: 4px;">Node.js</span>
            <span style="background: #f1f5f9; padding: 2px 6px; font-size: 11px; border-radius: 4px;">PostgreSQL</span>
            <span style="background: #f1f5f9; padding: 2px 6px; font-size: 11px; border-radius: 4px;">Docker</span>
          </div>
        </div>
      `;
    }

    modal.classList.add('active');
  }
};
