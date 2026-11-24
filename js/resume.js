/**
 * Resume Builder - Multi-Step Wizard & Live Preview Engine
 * Handles 10-step form wizard, dynamic repeaters, live template rendering, auto-save, PDF export, and JSON exchange.
 */

document.addEventListener('DOMContentLoaded', () => {
  ResumeBuilder.init();
});

const ResumeBuilder = {
  currentStep: 1,
  totalSteps: 10,
  currentResume: null,
  zoomLevel: 1,
  autoSaveTimer: null,

  init() {
    Auth.requireAuth();
    this.loadResumeData();
    this.initWizardNavigation();
    this.initStepForms();
    this.initDynamicRepeaters();
    this.initToolbarControls();
    this.initMobileSwitcher();
    this.renderLivePreview();

    // Check if auto-print parameter is set
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      setTimeout(() => {
        window.print();
      }, 700);
    }
  },

  // --- Resume Data Initialization ---
  loadResumeData() {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('id');
    const templateParam = params.get('template');
    const isNew = params.get('new') === 'true';

    if (resumeId && !isNew) {
      const found = StorageManager.getResumeById(resumeId);
      if (found) {
        this.currentResume = JSON.parse(JSON.stringify(found));
      }
    }

    if (!this.currentResume && !isNew) {
      // Pick first resume by default
      const resumes = StorageManager.getResumes();
      if (resumes.length > 0) {
        this.currentResume = JSON.parse(JSON.stringify(resumes[0]));
      }
    }

    // Default template override
    if (templateParam) {
      if (!this.currentResume) {
        this.createNewEmptyResume();
      }
      this.currentResume.template = templateParam;
    }

    // Fallback if brand new
    if (!this.currentResume) {
      this.createNewEmptyResume();
    }

    // Populate all form fields
    this.populateFormsFromData();
  },

  createNewEmptyResume() {
    const currentUser = StorageManager.getCurrentUser() || {};
    this.currentResume = {
      id: 'res_' + Date.now(),
      userId: currentUser.id || 'usr_demo_101',
      title: 'New Resume',
      template: 'modern',
      themeColor: '#4f46e5',
      fontFamily: 'Inter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personal: {
        fullName: currentUser.name || 'Your Full Name',
        jobTitle: currentUser.jobTitle || 'Your Professional Title',
        email: currentUser.email || 'your.email@example.com',
        phone: currentUser.phone || '+1 (555) 000-0000',
        address: currentUser.location || 'City, Country',
        linkedin: 'linkedin.com/in/username',
        github: 'github.com/username',
        portfolio: 'yourportfolio.dev',
        photo: currentUser.avatar || ''
      },
      summary: 'Passionate and detail-oriented professional with demonstrated expertise in delivering high-impact solutions, collaborating across cross-functional teams, and driving continuous improvement.',
      education: [
        {
          id: 'edu_' + Date.now(),
          college: 'University Name',
          degree: 'Bachelor of Science',
          branch: 'Computer Science',
          cgpa: '3.8 / 4.0',
          startYear: '2018',
          endYear: '2022'
        }
      ],
      experience: [
        {
          id: 'exp_' + Date.now(),
          company: 'Acme Corporation',
          role: 'Software Developer',
          location: 'San Francisco, CA',
          startDate: 'Jun 2022',
          endDate: 'Present',
          current: true,
          description: '• Developed and maintained key features for customer-facing web applications.\n• Collaborated with design and product teams to enhance user satisfaction.\n• Improved application reliability through unit and integration testing.'
        }
      ],
      skills: [
        { name: 'JavaScript', level: 'Advanced', category: 'Technical' },
        { name: 'React', level: 'Advanced', category: 'Technical' },
        { name: 'CSS3 & HTML5', level: 'Expert', category: 'Technical' },
        { name: 'Git & Version Control', level: 'Advanced', category: 'Technical' },
        { name: 'Team Leadership', level: 'Intermediate', category: 'Soft skills' }
      ],
      projects: [
        {
          id: 'proj_' + Date.now(),
          name: 'Personal Portfolio Platform',
          description: 'Responsive web platform showcasing projects, technical blogs, and interactive components.',
          technologies: 'HTML5, CSS3, JavaScript',
          github: 'https://github.com/username/portfolio',
          liveUrl: 'https://username.dev'
        }
      ],
      certifications: [
        {
          id: 'cert_' + Date.now(),
          name: 'Professional Web Developer Certification',
          organization: 'Tech Academy',
          year: '2023',
          url: ''
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Native / Bilingual' }
      ],
      interests: ['Open Source', 'UI/UX Design', 'Continuous Learning']
    };
  },

  populateFormsFromData() {
    const r = this.currentResume;
    if (!r) return;

    // Title
    const titleInput = document.getElementById('resumeDocTitle');
    if (titleInput) titleInput.value = r.title || 'Untitled Resume';

    // Step 1: Personal
    const p = r.personal || {};
    this.setVal('personalFullName', p.fullName);
    this.setVal('personalJobTitle', p.jobTitle);
    this.setVal('personalEmail', p.email);
    this.setVal('personalPhone', p.phone);
    this.setVal('personalAddress', p.address);
    this.setVal('personalLinkedin', p.linkedin);
    this.setVal('personalGithub', p.github);
    this.setVal('personalPortfolio', p.portfolio);

    const photoPreview = document.getElementById('personalPhotoPreview');
    if (photoPreview) {
      if (p.photo) {
        photoPreview.src = p.photo;
        photoPreview.style.display = 'block';
      } else {
        photoPreview.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
      }
    }

    // Step 2: Summary
    const summaryInput = document.getElementById('personalSummary');
    if (summaryInput) {
      summaryInput.value = r.summary || '';
      this.updateCharCounter(summaryInput);
    }

    // Step 3-9: Repeaters
    this.renderEducationList();
    this.renderExperienceList();
    this.renderSkillsList();
    this.renderProjectsList();
    this.renderCertificationsList();
    this.renderLanguagesList();
    this.renderInterestsList();

    // Step 10: Template & Styling Toolbar
    const tmplSelect = document.getElementById('toolbarTemplateSelect');
    if (tmplSelect) tmplSelect.value = r.template || 'modern';

    const fontSelect = document.getElementById('toolbarFontSelect');
    if (fontSelect) fontSelect.value = r.fontFamily || 'Inter';

    this.highlightActiveColorSwatch(r.themeColor || '#4f46e5');
  },

  setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  },

  // --- Step Wizard Navigation ---
  initWizardNavigation() {
    const stepNodes = document.querySelectorAll('.wizard-step-node');
    stepNodes.forEach(node => {
      node.addEventListener('click', () => {
        const stepNum = parseInt(node.getAttribute('data-step'), 10);
        this.goToStep(stepNum);
      });
    });

    const nextBtns = document.querySelectorAll('.next-step-btn');
    nextBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentStep < this.totalSteps) {
          this.goToStep(this.currentStep + 1);
        }
      });
    });

    const prevBtns = document.querySelectorAll('.prev-step-btn');
    prevBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentStep > 1) {
          this.goToStep(this.currentStep - 1);
        }
      });
    });

    // Resume Document Title auto-save
    const docTitle = document.getElementById('resumeDocTitle');
    if (docTitle) {
      docTitle.addEventListener('input', (e) => {
        this.currentResume.title = e.target.value;
        this.triggerAutoSave();
      });
    }
  },

  goToStep(stepNum) {
    if (stepNum < 1 || stepNum > this.totalSteps) return;

    this.currentStep = stepNum;

    // Update wizard nodes
    const stepNodes = document.querySelectorAll('.wizard-step-node');
    stepNodes.forEach(node => {
      const num = parseInt(node.getAttribute('data-step'), 10);
      node.classList.remove('active', 'completed');
      if (num === stepNum) {
        node.classList.add('active');
      } else if (num < stepNum) {
        node.classList.add('completed');
      }
    });

    // Show active step section
    const sections = document.querySelectorAll('.step-content-section');
    sections.forEach(sec => {
      sec.classList.remove('active');
      if (parseInt(sec.getAttribute('data-step'), 10) === stepNum) {
        sec.classList.add('active');
      }
    });

    // Scroll editor to top
    const editor = document.querySelector('.builder-editor-pane');
    if (editor) editor.scrollTop = 0;
  },

  // --- Live Form Bindings ---
  initStepForms() {
    // Step 1: Personal Inputs
    const personalFields = [
      'personalFullName', 'personalJobTitle', 'personalEmail', 'personalPhone',
      'personalAddress', 'personalLinkedin', 'personalGithub', 'personalPortfolio'
    ];

    personalFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const fieldKey = id.replace('personal', '');
          const lowerKey = fieldKey.charAt(0).toLowerCase() + fieldKey.slice(1);
          if (!this.currentResume.personal) this.currentResume.personal = {};
          this.currentResume.personal[lowerKey] = el.value;
          this.renderLivePreview();
          this.triggerAutoSave();
        });
      }
    });

    // Photo Upload
    const photoInput = document.getElementById('photoFileInput');
    const photoUploadBtn = document.getElementById('uploadPhotoBtn');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const photoPreview = document.getElementById('personalPhotoPreview');

    if (photoUploadBtn && photoInput) {
      photoUploadBtn.addEventListener('click', () => photoInput.click());
    }

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          if (photoPreview) photoPreview.src = base64;
          if (!this.currentResume.personal) this.currentResume.personal = {};
          this.currentResume.personal.photo = base64;
          this.renderLivePreview();
          this.triggerAutoSave();
          App.showToast('Photo uploaded!', 'success', 1500);
        };
        reader.readAsDataURL(file);
      });
    }

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        if (!this.currentResume.personal) this.currentResume.personal = {};
        this.currentResume.personal.photo = '';
        if (photoPreview) photoPreview.src = '';
        this.renderLivePreview();
        this.triggerAutoSave();
        App.showToast('Photo removed.', 'info', 1500);
      });
    }

    // Step 2: Summary
    const summaryInput = document.getElementById('personalSummary');
    if (summaryInput) {
      summaryInput.addEventListener('input', () => {
        this.currentResume.summary = summaryInput.value;
        this.updateCharCounter(summaryInput);
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // AI Suggestions Button
    const aiSummaryBtn = document.getElementById('aiSummarySuggestBtn');
    if (aiSummaryBtn) {
      aiSummaryBtn.addEventListener('click', () => {
        const role = (this.currentResume.personal && this.currentResume.personal.jobTitle) || 'Software Engineer';
        const sampleSummaries = [
          `Results-oriented ${role} with proven track record designing scalable software solutions, optimizing performance by 40%, and delivering complex projects on aggressive deadlines. Adept at cross-functional collaboration and agile methodologies.`,
          `Innovative and analytical ${role} with over 5 years of hands-on experience crafting reliable, user-centered digital applications. Skilled in modern architectural patterns, clean code principles, and automated CI/CD workflows.`,
          `Dynamic and high-performing ${role} recognized for strong problem-solving capabilities, technical leadership, and driving continuous business value through intuitive engineering solutions.`
        ];
        const randomSummary = sampleSummaries[Math.floor(Math.random() * sampleSummaries.length)];
        summaryInput.value = randomSummary;
        this.currentResume.summary = randomSummary;
        this.updateCharCounter(summaryInput);
        this.renderLivePreview();
        this.triggerAutoSave();
        App.showToast('AI-powered professional summary applied!', 'success');
      });
    }
  },

  updateCharCounter(textarea) {
    const counter = document.getElementById('summaryCharCount');
    if (counter) {
      const len = textarea.value.length;
      counter.textContent = `${len} / 600 characters`;
      if (len > 550) {
        counter.style.color = 'var(--warning)';
      } else {
        counter.style.color = 'var(--text-muted)';
      }
    }
  },

  // --- Dynamic Repeaters ---
  initDynamicRepeaters() {
    // Add Education
    const addEduBtn = document.getElementById('addEducationBtn');
    if (addEduBtn) {
      addEduBtn.addEventListener('click', () => {
        if (!this.currentResume.education) this.currentResume.education = [];
        this.currentResume.education.push({
          id: 'edu_' + Date.now(),
          college: '',
          degree: '',
          branch: '',
          cgpa: '',
          startYear: '',
          endYear: ''
        });
        this.renderEducationList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Add Experience
    const addExpBtn = document.getElementById('addExperienceBtn');
    if (addExpBtn) {
      addExpBtn.addEventListener('click', () => {
        if (!this.currentResume.experience) this.currentResume.experience = [];
        this.currentResume.experience.push({
          id: 'exp_' + Date.now(),
          company: '',
          role: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: ''
        });
        this.renderExperienceList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Add Skill
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillNameInput = document.getElementById('newSkillNameInput');
    const skillLevelSelect = document.getElementById('newSkillLevelSelect');

    const addSkillAction = () => {
      const name = skillNameInput.value.trim();
      if (!name) return;

      if (!this.currentResume.skills) this.currentResume.skills = [];
      this.currentResume.skills.push({
        name,
        level: skillLevelSelect ? skillLevelSelect.value : 'Intermediate',
        category: 'Technical'
      });
      skillNameInput.value = '';
      this.renderSkillsList();
      this.renderLivePreview();
      this.triggerAutoSave();
    };

    if (addSkillBtn) addSkillBtn.addEventListener('click', addSkillAction);
    if (skillNameInput) {
      skillNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkillAction();
        }
      });
    }

    // Quick Skill Suggestion Pills
    document.querySelectorAll('.skill-pill-suggest').forEach(pill => {
      pill.addEventListener('click', () => {
        const skillName = pill.getAttribute('data-skill');
        if (!this.currentResume.skills) this.currentResume.skills = [];
        if (!this.currentResume.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
          this.currentResume.skills.push({
            name: skillName,
            level: 'Advanced',
            category: 'Technical'
          });
          this.renderSkillsList();
          this.renderLivePreview();
          this.triggerAutoSave();
          App.showToast(`Added ${skillName}`, 'info', 1500);
        }
      });
    });

    // Add Project
    const addProjBtn = document.getElementById('addProjectBtn');
    if (addProjBtn) {
      addProjBtn.addEventListener('click', () => {
        if (!this.currentResume.projects) this.currentResume.projects = [];
        this.currentResume.projects.push({
          id: 'proj_' + Date.now(),
          name: '',
          description: '',
          technologies: '',
          github: '',
          liveUrl: ''
        });
        this.renderProjectsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Add Certification
    const addCertBtn = document.getElementById('addCertBtn');
    if (addCertBtn) {
      addCertBtn.addEventListener('click', () => {
        if (!this.currentResume.certifications) this.currentResume.certifications = [];
        this.currentResume.certifications.push({
          id: 'cert_' + Date.now(),
          name: '',
          organization: '',
          year: '',
          url: ''
        });
        this.renderCertificationsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Add Language
    const addLangBtn = document.getElementById('addLangBtn');
    if (addLangBtn) {
      addLangBtn.addEventListener('click', () => {
        if (!this.currentResume.languages) this.currentResume.languages = [];
        this.currentResume.languages.push({
          name: '',
          proficiency: 'Fluent'
        });
        this.renderLanguagesList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Add Interest
    const addInterestBtn = document.getElementById('addInterestBtn');
    const interestInput = document.getElementById('interestInput');

    const addInterestAction = () => {
      const text = interestInput.value.trim();
      if (!text) return;

      if (!this.currentResume.interests) this.currentResume.interests = [];
      this.currentResume.interests.push(text);
      interestInput.value = '';
      this.renderInterestsList();
      this.renderLivePreview();
      this.triggerAutoSave();
    };

    if (addInterestBtn) addInterestBtn.addEventListener('click', addInterestAction);
    if (interestInput) {
      interestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addInterestAction();
        }
      });
    }
  },

  // --- Render Repeater UI Cards ---
  renderEducationList() {
    const container = document.getElementById('educationRepeaterList');
    if (!container) return;

    const list = this.currentResume.education || [];
    container.innerHTML = list.map((item, index) => `
      <div class="repeater-card" data-index="${index}">
        <div class="repeater-card-header">
          <div class="repeater-card-title"><i class="fa-solid fa-graduation-cap"></i> Education #${index + 1}</div>
          <button type="button" class="repeater-card-remove remove-edu-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">College / University</label>
            <input type="text" class="form-control edu-field" data-field="college" value="${this.escapeHtml(item.college || '')}" placeholder="e.g. Stanford University">
          </div>
          <div class="form-group">
            <label class="form-label">Degree</label>
            <input type="text" class="form-control edu-field" data-field="degree" value="${this.escapeHtml(item.degree || '')}" placeholder="e.g. Bachelor of Science">
          </div>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">Branch / Field</label>
            <input type="text" class="form-control edu-field" data-field="branch" value="${this.escapeHtml(item.branch || '')}" placeholder="e.g. Computer Science">
          </div>
          <div class="form-group">
            <label class="form-label">CGPA / Percentage</label>
            <input type="text" class="form-control edu-field" data-field="cgpa" value="${this.escapeHtml(item.cgpa || '')}" placeholder="e.g. 3.9 / 4.0">
          </div>
          <div class="form-group">
            <label class="form-label">Years</label>
            <div class="flex gap-1">
              <input type="text" class="form-control edu-field" data-field="startYear" value="${this.escapeHtml(item.startYear || '')}" placeholder="Start">
              <input type="text" class="form-control edu-field" data-field="endYear" value="${this.escapeHtml(item.endYear || '')}" placeholder="End">
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Bind inputs & removes
    container.querySelectorAll('.edu-field').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.closest('.repeater-card').getAttribute('data-index'), 10);
        const field = input.getAttribute('data-field');
        this.currentResume.education[idx][field] = input.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.remove-edu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.education.splice(idx, 1);
        this.renderEducationList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderExperienceList() {
    const container = document.getElementById('experienceRepeaterList');
    if (!container) return;

    const list = this.currentResume.experience || [];
    container.innerHTML = list.map((item, index) => `
      <div class="repeater-card" data-index="${index}">
        <div class="repeater-card-header">
          <div class="repeater-card-title"><i class="fa-solid fa-briefcase"></i> Experience #${index + 1}</div>
          <button type="button" class="repeater-card-remove remove-exp-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Company Name</label>
            <input type="text" class="form-control exp-field" data-field="company" value="${this.escapeHtml(item.company || '')}" placeholder="e.g. Google">
          </div>
          <div class="form-group">
            <label class="form-label">Job Role / Title</label>
            <input type="text" class="form-control exp-field" data-field="role" value="${this.escapeHtml(item.role || '')}" placeholder="e.g. Senior Frontend Engineer">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-control exp-field" data-field="location" value="${this.escapeHtml(item.location || '')}" placeholder="e.g. New York, NY (or Remote)">
          </div>
          <div class="form-group">
            <label class="form-label">Duration</label>
            <div class="flex gap-1 items-center">
              <input type="text" class="form-control exp-field" data-field="startDate" value="${this.escapeHtml(item.startDate || '')}" placeholder="e.g. Jan 2022">
              <span>to</span>
              <input type="text" class="form-control exp-field" data-field="endDate" value="${this.escapeHtml(item.current ? 'Present' : (item.endDate || ''))}" placeholder="e.g. Present" ${item.current ? 'disabled' : ''}>
            </div>
            <label class="custom-checkbox" style="margin-top: 0.35rem; font-size: 0.8rem;">
              <input type="checkbox" class="exp-current-check" ${item.current ? 'checked' : ''}>
              <span>I currently work here</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Responsibilities & Achievements (Bullet points recommended)</label>
          <textarea class="form-control exp-field" data-field="description" rows="3" placeholder="• Architected and shipped...&#10;• Reduced latency by 35%...">${this.escapeHtml(item.description || '')}</textarea>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.exp-field').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.closest('.repeater-card').getAttribute('data-index'), 10);
        const field = input.getAttribute('data-field');
        this.currentResume.experience[idx][field] = input.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.exp-current-check').forEach(chk => {
      chk.addEventListener('change', () => {
        const idx = parseInt(chk.closest('.repeater-card').getAttribute('data-index'), 10);
        this.currentResume.experience[idx].current = chk.checked;
        if (chk.checked) {
          this.currentResume.experience[idx].endDate = 'Present';
        }
        this.renderExperienceList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.remove-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.experience.splice(idx, 1);
        this.renderExperienceList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderSkillsList() {
    const container = document.getElementById('skillsBadgeContainer');
    if (!container) return;

    const list = this.currentResume.skills || [];
    container.innerHTML = list.map((skill, index) => `
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-full); padding: 0.35rem 0.85rem; font-size: 0.85rem;">
        <span style="font-weight: 700; color: var(--text-main);">${this.escapeHtml(skill.name)}</span>
        <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">(${skill.level || 'Intermediate'})</span>
        <button type="button" class="remove-skill-btn" data-index="${index}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem;" title="Remove">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.skills.splice(idx, 1);
        this.renderSkillsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderProjectsList() {
    const container = document.getElementById('projectsRepeaterList');
    if (!container) return;

    const list = this.currentResume.projects || [];
    container.innerHTML = list.map((proj, index) => `
      <div class="repeater-card" data-index="${index}">
        <div class="repeater-card-header">
          <div class="repeater-card-title"><i class="fa-solid fa-code"></i> Project #${index + 1}</div>
          <button type="button" class="repeater-card-remove remove-proj-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-control proj-field" data-field="name" value="${this.escapeHtml(proj.name || '')}" placeholder="e.g. Cloud Telemetry Dashboard">
          </div>
          <div class="form-group">
            <label class="form-label">Technologies Used</label>
            <input type="text" class="form-control proj-field" data-field="technologies" value="${this.escapeHtml(proj.technologies || '')}" placeholder="e.g. React, Node.js, PostgreSQL">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">GitHub Repository URL</label>
            <input type="url" class="form-control proj-field" data-field="github" value="${this.escapeHtml(proj.github || '')}" placeholder="https://github.com/...">
          </div>
          <div class="form-group">
            <label class="form-label">Live Demo / Product URL</label>
            <input type="url" class="form-control proj-field" data-field="liveUrl" value="${this.escapeHtml(proj.liveUrl || '')}" placeholder="https://...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Project Description</label>
          <textarea class="form-control proj-field" data-field="description" rows="2" placeholder="Brief summary of the architecture and results...">${this.escapeHtml(proj.description || '')}</textarea>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.proj-field').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.closest('.repeater-card').getAttribute('data-index'), 10);
        const field = input.getAttribute('data-field');
        this.currentResume.projects[idx][field] = input.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.remove-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.projects.splice(idx, 1);
        this.renderProjectsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderCertificationsList() {
    const container = document.getElementById('certificationsRepeaterList');
    if (!container) return;

    const list = this.currentResume.certifications || [];
    container.innerHTML = list.map((cert, index) => `
      <div class="repeater-card" data-index="${index}">
        <div class="repeater-card-header">
          <div class="repeater-card-title"><i class="fa-solid fa-certificate"></i> Certification #${index + 1}</div>
          <button type="button" class="repeater-card-remove remove-cert-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">Certificate Name</label>
            <input type="text" class="form-control cert-field" data-field="name" value="${this.escapeHtml(cert.name || '')}" placeholder="e.g. AWS Solutions Architect">
          </div>
          <div class="form-group">
            <label class="form-label">Issuing Organization</label>
            <input type="text" class="form-control cert-field" data-field="organization" value="${this.escapeHtml(cert.organization || '')}" placeholder="e.g. Amazon Web Services">
          </div>
          <div class="form-group">
            <label class="form-label">Year</label>
            <input type="text" class="form-control cert-field" data-field="year" value="${this.escapeHtml(cert.year || '')}" placeholder="e.g. 2023">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.cert-field').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.closest('.repeater-card').getAttribute('data-index'), 10);
        const field = input.getAttribute('data-field');
        this.currentResume.certifications[idx][field] = input.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.remove-cert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.certifications.splice(idx, 1);
        this.renderCertificationsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderLanguagesList() {
    const container = document.getElementById('languagesRepeaterList');
    if (!container) return;

    const list = this.currentResume.languages || [];
    container.innerHTML = list.map((lang, index) => `
      <div class="flex items-center gap-1" style="margin-bottom: 0.75rem;">
        <input type="text" class="form-control lang-name-input" data-index="${index}" value="${this.escapeHtml(lang.name || '')}" placeholder="e.g. English, French, Spanish" style="flex: 1;">
        <select class="form-control lang-prof-select" data-index="${index}" style="width: 180px;">
          <option value="Native / Bilingual" ${lang.proficiency === 'Native / Bilingual' ? 'selected' : ''}>Native / Bilingual</option>
          <option value="Fluent" ${lang.proficiency === 'Fluent' ? 'selected' : ''}>Fluent</option>
          <option value="Professional Working" ${lang.proficiency === 'Professional Working' ? 'selected' : ''}>Professional Working</option>
          <option value="Conversational" ${lang.proficiency === 'Conversational' ? 'selected' : ''}>Conversational</option>
          <option value="Elementary" ${lang.proficiency === 'Elementary' ? 'selected' : ''}>Elementary</option>
        </select>
        <button type="button" class="btn btn-ghost btn-icon remove-lang-btn" data-index="${index}" style="color: var(--danger);"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.lang-name-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.getAttribute('data-index'), 10);
        this.currentResume.languages[idx].name = input.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.lang-prof-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.getAttribute('data-index'), 10);
        this.currentResume.languages[idx].proficiency = sel.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    container.querySelectorAll('.remove-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.languages.splice(idx, 1);
        this.renderLanguagesList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  renderInterestsList() {
    const container = document.getElementById('interestsBadgeContainer');
    if (!container) return;

    const list = this.currentResume.interests || [];
    container.innerHTML = list.map((item, index) => `
      <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-full); padding: 0.3rem 0.75rem; font-size: 0.85rem;">
        <span>${this.escapeHtml(item)}</span>
        <button type="button" class="remove-interest-btn" data-index="${index}" style="background: none; border: none; color: var(--text-muted); cursor: pointer;" title="Remove">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-interest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentResume.interests.splice(idx, 1);
        this.renderInterestsList();
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });
  },

  // --- Toolbar Controls (Zoom, Template, Color, Font, Export) ---
  initToolbarControls() {
    // Template Select
    const tmplSelect = document.getElementById('toolbarTemplateSelect');
    if (tmplSelect) {
      tmplSelect.addEventListener('change', () => {
        this.currentResume.template = tmplSelect.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Font Family Select
    const fontSelect = document.getElementById('toolbarFontSelect');
    if (fontSelect) {
      fontSelect.addEventListener('change', () => {
        this.currentResume.fontFamily = fontSelect.value;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    }

    // Color Swatches
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.getAttribute('data-color');
        this.currentResume.themeColor = color;
        this.renderLivePreview();
        this.triggerAutoSave();
      });
    });

    // Zoom Controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (this.zoomLevel < 1.3) {
          this.zoomLevel += 0.1;
          this.applyZoom();
        }
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (this.zoomLevel > 0.5) {
          this.zoomLevel -= 0.1;
          this.applyZoom();
        }
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.zoomLevel = 1;
        this.applyZoom();
      });
    }

    // Download / Print PDF
    const printBtn = document.getElementById('printPdfBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        StorageManager.incrementDownloadCount();
        App.showToast('Preparing PDF document for printing...', 'info', 2000);
        setTimeout(() => {
          window.print();
        }, 300);
      });
    }

    // Export JSON
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        const jsonStr = JSON.stringify(this.currentResume, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this.currentResume.title || 'resume').replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showToast('Resume JSON exported successfully!', 'success');
      });
    }

    // Manual Save Button
    const saveBtn = document.getElementById('saveResumeBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveCurrentResume();
        App.showToast('Resume saved successfully to My Resumes!', 'success');
      });
    }
  },

  applyZoom() {
    const paper = document.getElementById('liveResumePaper');
    const zoomDisplay = document.getElementById('zoomLevelDisplay');
    if (paper) {
      paper.style.transform = `scale(${this.zoomLevel})`;
    }
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  },

  highlightActiveColorSwatch(color) {
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(d => {
      d.classList.remove('active');
      if (d.getAttribute('data-color') === color) {
        d.classList.add('active');
      }
    });
  },

  // --- Auto-Save to LocalStorage ---
  triggerAutoSave() {
    const badge = document.getElementById('autoSaveBadge');
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      badge.style.color = 'var(--warning)';
    }

    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveCurrentResume();
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved just now';
        badge.style.color = 'var(--success)';
      }
    }, 600);
  },

  saveCurrentResume() {
    if (!this.currentResume) return;
    const saved = StorageManager.saveResume(this.currentResume);
    this.currentResume.id = saved.id;
  },

  // --- Mobile Form vs Preview View Switcher ---
  initMobileSwitcher() {
    const editTabBtn = document.getElementById('mobileEditTabBtn');
    const previewTabBtn = document.getElementById('mobilePreviewTabBtn');
    const layout = document.querySelector('.builder-layout');

    if (editTabBtn && previewTabBtn && layout) {
      editTabBtn.addEventListener('click', () => {
        editTabBtn.classList.add('active');
        previewTabBtn.classList.remove('active');
        layout.classList.remove('show-preview');
      });

      previewTabBtn.addEventListener('click', () => {
        previewTabBtn.classList.add('active');
        editTabBtn.classList.remove('active');
        layout.classList.add('show-preview');
      });
    }
  },

  // =========================================================================
  // LIVE TEMPLATE RENDERER (ALL 10 TEMPLATES)
  // =========================================================================
  renderLivePreview() {
    const paper = document.getElementById('liveResumePaper');
    if (!paper) return;

    const r = this.currentResume;
    const template = r.template || 'modern';
    const accent = r.themeColor || '#4f46e5';
    const font = r.fontFamily || 'Inter';

    paper.className = `resume-paper template-${template}`;
    paper.style.fontFamily = `'${font}', -apple-system, BlinkMacSystemFont, sans-serif`;
    paper.style.setProperty('--resume-accent', accent);

    const p = r.personal || {};

    switch (template) {
      case 'ats':
        paper.innerHTML = this.templateATS(r, p, accent);
        break;
      case 'creative':
        paper.innerHTML = this.templateCreative(r, p, accent);
        break;
      case 'executive':
        paper.innerHTML = this.templateExecutive(r, p, accent);
        break;
      case 'student':
        paper.innerHTML = this.templateStudent(r, p, accent);
        break;
      case 'minimal':
        paper.innerHTML = this.templateMinimal(r, p, accent);
        break;
      case 'elegant':
        paper.innerHTML = this.templateElegant(r, p, accent);
        break;
      case 'professional':
        paper.innerHTML = this.templateProfessional(r, p, accent);
        break;
      case 'corporate':
        paper.innerHTML = this.templateCorporate(r, p, accent);
        break;
      case 'fresher':
        paper.innerHTML = this.templateFresher(r, p, accent);
        break;
      case 'modern':
      default:
        paper.innerHTML = this.templateModern(r, p, accent);
        break;
    }
  },

  // 1. MODERN TEMPLATE
  templateModern(r, p, accent) {
    return `
      <div class="modern-sidebar">
        ${p.photo ? `<img src="${p.photo}" alt="Profile Photo" class="modern-avatar">` : ''}

        <div>
          <div class="sidebar-title">Contact</div>
          ${p.email ? `<div class="contact-item"><i class="fa-regular fa-envelope"></i> ${this.escapeHtml(p.email)}</div>` : ''}
          ${p.phone ? `<div class="contact-item"><i class="fa-solid fa-phone"></i> ${this.escapeHtml(p.phone)}</div>` : ''}
          ${p.address ? `<div class="contact-item"><i class="fa-solid fa-location-dot"></i> ${this.escapeHtml(p.address)}</div>` : ''}
          ${p.linkedin ? `<div class="contact-item"><i class="fa-brands fa-linkedin"></i> ${this.escapeHtml(p.linkedin)}</div>` : ''}
          ${p.github ? `<div class="contact-item"><i class="fa-brands fa-github"></i> ${this.escapeHtml(p.github)}</div>` : ''}
          ${p.portfolio ? `<div class="contact-item"><i class="fa-solid fa-globe"></i> ${this.escapeHtml(p.portfolio)}</div>` : ''}
        </div>

        ${(r.skills && r.skills.length) ? `
          <div>
            <div class="sidebar-title">Skills</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${r.skills.map(s => `
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                  <span style="font-weight: 600;">${this.escapeHtml(s.name)}</span>
                  <span style="color: #64748b;">${s.level || ''}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${(r.languages && r.languages.length) ? `
          <div>
            <div class="sidebar-title">Languages</div>
            ${r.languages.map(l => `
              <div style="font-size: 11.5px; margin-bottom: 3px;">
                <strong>${this.escapeHtml(l.name)}</strong> <span style="color: #64748b;">(${l.proficiency})</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(r.interests && r.interests.length) ? `
          <div>
            <div class="sidebar-title">Interests</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${r.interests.map(i => `<span style="font-size: 10px; background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${this.escapeHtml(i)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="modern-main">
        <div class="modern-header">
          <h1>${this.escapeHtml(p.fullName || 'Your Full Name')}</h1>
          <h2>${this.escapeHtml(p.jobTitle || 'Your Job Title')}</h2>
        </div>

        ${r.summary ? `
          <div>
            <div class="section-heading">Professional Summary</div>
            <p style="font-size: 12.5px; line-height: 1.5; color: #334155;">${this.escapeHtml(r.summary)}</p>
          </div>
        ` : ''}

        ${(r.experience && r.experience.length) ? `
          <div>
            <div class="section-heading">Experience</div>
            ${r.experience.map(exp => `
              <div class="resume-entry">
                <div class="resume-entry-header">
                  <span class="resume-entry-title">${this.escapeHtml(exp.role)} – ${this.escapeHtml(exp.company)}</span>
                  <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                </div>
                ${exp.location ? `<div style="font-size: 11px; color: #64748b;">${this.escapeHtml(exp.location)}</div>` : ''}
                <div class="resume-entry-desc">${this.escapeHtml(exp.description)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(r.education && r.education.length) ? `
          <div>
            <div class="section-heading">Education</div>
            ${r.education.map(edu => `
              <div class="resume-entry">
                <div class="resume-entry-header">
                  <span class="resume-entry-title">${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</span>
                  <span class="resume-entry-date">${edu.startYear} - ${edu.endYear}</span>
                </div>
                <div class="resume-entry-subtitle">${this.escapeHtml(edu.college)} ${edu.cgpa ? `• GPA: ${edu.cgpa}` : ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(r.projects && r.projects.length) ? `
          <div>
            <div class="section-heading">Key Projects</div>
            ${r.projects.map(proj => `
              <div class="resume-entry">
                <div class="resume-entry-header">
                  <span class="resume-entry-title">${this.escapeHtml(proj.name)}</span>
                  ${proj.technologies ? `<span style="font-size: 11px; color: ${accent}; font-weight: 600;">${this.escapeHtml(proj.technologies)}</span>` : ''}
                </div>
                <div class="resume-entry-desc">${this.escapeHtml(proj.description)}</div>
                ${proj.github || proj.liveUrl ? `
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                    ${proj.github ? `<span>GitHub: ${this.escapeHtml(proj.github)}</span> ` : ''}
                    ${proj.liveUrl ? `<span>Live: ${this.escapeHtml(proj.liveUrl)}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(r.certifications && r.certifications.length) ? `
          <div>
            <div class="section-heading">Certifications</div>
            ${r.certifications.map(c => `
              <div style="font-size: 12px; margin-bottom: 4px;">
                <strong>${this.escapeHtml(c.name)}</strong> – ${this.escapeHtml(c.organization)} (${c.year})
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  // 2. ATS FRIENDLY TEMPLATE
  templateATS(r, p) {
    return `
      <div class="ats-header">
        <h1>${this.escapeHtml(p.fullName || 'YOUR NAME')}</h1>
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px;">${this.escapeHtml(p.jobTitle || 'PROFESSIONAL TITLE')}</div>
        <div class="ats-contact">
          ${p.email ? `<span>Email: ${this.escapeHtml(p.email)}</span>` : ''}
          ${p.phone ? `<span>Phone: ${this.escapeHtml(p.phone)}</span>` : ''}
          ${p.address ? `<span>Location: ${this.escapeHtml(p.address)}</span>` : ''}
          ${p.linkedin ? `<span>LinkedIn: ${this.escapeHtml(p.linkedin)}</span>` : ''}
          ${p.github ? `<span>GitHub: ${this.escapeHtml(p.github)}</span>` : ''}
        </div>
      </div>

      ${r.summary ? `
        <div class="ats-section">
          <div class="ats-section-title">PROFESSIONAL SUMMARY</div>
          <p style="font-size: 12.5px; line-height: 1.5;">${this.escapeHtml(r.summary)}</p>
        </div>
      ` : ''}

      ${(r.skills && r.skills.length) ? `
        <div class="ats-section">
          <div class="ats-section-title">CORE COMPETENCIES & TECHNICAL SKILLS</div>
          <p style="font-size: 12.5px;">
            ${r.skills.map(s => `<strong>${this.escapeHtml(s.name)}</strong> (${s.level || 'Intermediate'})`).join(' • ')}
          </p>
        </div>
      ` : ''}

      ${(r.experience && r.experience.length) ? `
        <div class="ats-section">
          <div class="ats-section-title">PROFESSIONAL WORK EXPERIENCE</div>
          ${r.experience.map(exp => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <strong>${this.escapeHtml(exp.role)} | ${this.escapeHtml(exp.company)}</strong>
                <span>${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              ${exp.location ? `<div style="font-size: 11.5px; font-style: italic;">${this.escapeHtml(exp.location)}</div>` : ''}
              <div style="font-size: 12px; margin-top: 4px; white-space: pre-line; line-height: 1.45;">${this.escapeHtml(exp.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.education && r.education.length) ? `
        <div class="ats-section">
          <div class="ats-section-title">EDUCATION</div>
          ${r.education.map(edu => `
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px;">
              <div>
                <strong>${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</strong> – ${this.escapeHtml(edu.college)}
                ${edu.cgpa ? `<span> (GPA: ${edu.cgpa})</span>` : ''}
              </div>
              <span>${edu.startYear} - ${edu.endYear}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.projects && r.projects.length) ? `
        <div class="ats-section">
          <div class="ats-section-title">TECHNICAL PROJECTS</div>
          ${r.projects.map(proj => `
            <div style="margin-bottom: 8px; font-size: 12px;">
              <strong>${this.escapeHtml(proj.name)}</strong>: ${this.escapeHtml(proj.description)}
              ${proj.technologies ? `<div style="font-style: italic; font-size: 11px;">Technologies: ${this.escapeHtml(proj.technologies)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.certifications && r.certifications.length) ? `
        <div class="ats-section">
          <div class="ats-section-title">CERTIFICATIONS</div>
          <p style="font-size: 12px;">
            ${r.certifications.map(c => `${this.escapeHtml(c.name)} (${this.escapeHtml(c.organization)}, ${c.year})`).join(' • ')}
          </p>
        </div>
      ` : ''}
    `;
  },

  // 3. CREATIVE TEMPLATE
  templateCreative(r, p, accent) {
    return `
      <div class="creative-hero">
        ${p.photo ? `<img src="${p.photo}" alt="Profile Photo" class="creative-avatar">` : ''}
        <div style="flex: 1;">
          <h1>${this.escapeHtml(p.fullName || 'Your Name')}</h1>
          <h2>${this.escapeHtml(p.jobTitle || 'Creative Professional')}</h2>
          <div style="margin-top: 8px; font-size: 12px; display: flex; gap: 14px; flex-wrap: wrap; opacity: 0.95;">
            ${p.email ? `<span><i class="fa-regular fa-envelope"></i> ${this.escapeHtml(p.email)}</span>` : ''}
            ${p.phone ? `<span><i class="fa-solid fa-phone"></i> ${this.escapeHtml(p.phone)}</span>` : ''}
            ${p.portfolio ? `<span><i class="fa-solid fa-link"></i> ${this.escapeHtml(p.portfolio)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="creative-body">
        <div>
          ${r.summary ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 6px;">About Me</h3>
              <p style="font-size: 12.5px; line-height: 1.5; color: #334155;">${this.escapeHtml(r.summary)}</p>
            </div>
          ` : ''}

          ${(r.experience && r.experience.length) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 10px;">Experience</h3>
              ${r.experience.map(exp => `
                <div class="resume-entry">
                  <div class="resume-entry-header">
                    <span class="resume-entry-title">${this.escapeHtml(exp.role)}</span>
                    <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: ${accent};">${this.escapeHtml(exp.company)}</div>
                  <div class="resume-entry-desc">${this.escapeHtml(exp.description)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(r.projects && r.projects.length) ? `
            <div>
              <h3 style="font-size: 14px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 10px;">Featured Work</h3>
              ${r.projects.map(proj => `
                <div class="resume-entry">
                  <div class="resume-entry-header">
                    <span class="resume-entry-title">${this.escapeHtml(proj.name)}</span>
                  </div>
                  <div class="resume-entry-desc">${this.escapeHtml(proj.description)}</div>
                  ${proj.technologies ? `<div style="font-size: 11px; color: ${accent}; font-weight: 600; margin-top: 2px;">Stack: ${this.escapeHtml(proj.technologies)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          ${(r.skills && r.skills.length) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 8px;">Superpowers</h3>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${r.skills.map(s => `<span class="resume-skill-badge" style="background: rgba(99, 102, 241, 0.1); color: ${accent}; font-weight: 700;">${this.escapeHtml(s.name)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${(r.education && r.education.length) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 8px;">Education</h3>
              ${r.education.map(edu => `
                <div style="margin-bottom: 8px; font-size: 12px;">
                  <strong>${this.escapeHtml(edu.degree)}</strong>
                  <div style="color: #64748b;">${this.escapeHtml(edu.college)}</div>
                  <div style="color: #94a3b8; font-size: 11px;">${edu.startYear} - ${edu.endYear}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(r.languages && r.languages.length) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; margin-bottom: 8px;">Languages</h3>
              ${r.languages.map(l => `<div style="font-size: 11.5px; margin-bottom: 3px;"><strong>${this.escapeHtml(l.name)}</strong> (${l.proficiency})</div>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // 4. EXECUTIVE TEMPLATE
  templateExecutive(r, p, accent) {
    return `
      <div class="exec-header">
        <div>
          <h1>${this.escapeHtml(p.fullName || 'Executive Leader')}</h1>
          <div class="exec-title">${this.escapeHtml(p.jobTitle || 'Chief Executive / Director')}</div>
        </div>
        <div style="font-size: 11.5px; text-align: right; color: #475569;">
          ${p.email ? `<div>${this.escapeHtml(p.email)}</div>` : ''}
          ${p.phone ? `<div>${this.escapeHtml(p.phone)}</div>` : ''}
          ${p.address ? `<div>${this.escapeHtml(p.address)}</div>` : ''}
        </div>
      </div>

      ${r.summary ? `
        <div style="margin-bottom: 18px;">
          <div class="section-title">Executive Profile & Vision</div>
          <p style="font-size: 13px; line-height: 1.6; color: #1e293b;">${this.escapeHtml(r.summary)}</p>
        </div>
      ` : ''}

      ${(r.skills && r.skills.length) ? `
        <div style="margin-bottom: 18px;">
          <div class="section-title">Core Leadership Competencies</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px;">
            ${r.skills.map(s => `<span style="font-weight: 600; color: #0f172a;">• ${this.escapeHtml(s.name)}</span>`).join(' ')}
          </div>
        </div>
      ` : ''}

      ${(r.experience && r.experience.length) ? `
        <div style="margin-bottom: 20px;">
          <div class="section-title">Career Milestones & Leadership Experience</div>
          ${r.experience.map(exp => `
            <div class="resume-entry" style="margin-bottom: 16px;">
              <div class="resume-entry-header">
                <span class="resume-entry-title" style="font-size: 14.5px;">${this.escapeHtml(exp.role)} | ${this.escapeHtml(exp.company)}</span>
                <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div class="resume-entry-desc" style="font-size: 12.5px; line-height: 1.55;">${this.escapeHtml(exp.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.education && r.education.length) ? `
        <div>
          <div class="section-title">Academic Credentials</div>
          ${r.education.map(edu => `
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px;">
              <div><strong>${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</strong> – ${this.escapeHtml(edu.college)}</div>
              <span>${edu.startYear} - ${edu.endYear}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  // 5. STUDENT TEMPLATE
  templateStudent(r, p, accent) {
    return `
      <div class="student-header">
        <div>
          <h1>${this.escapeHtml(p.fullName || 'Student Name')}</h1>
          <div style="font-size: 14px; font-weight: 600; color: ${accent};">${this.escapeHtml(p.jobTitle || 'Computer Science Student')}</div>
        </div>
        <div style="text-align: right; font-size: 11.5px; color: #475569;">
          ${p.email ? `<div>${this.escapeHtml(p.email)}</div>` : ''}
          ${p.phone ? `<div>${this.escapeHtml(p.phone)}</div>` : ''}
          ${p.github ? `<div>GitHub: ${this.escapeHtml(p.github)}</div>` : ''}
        </div>
      </div>

      ${(r.education && r.education.length) ? `
        <div style="margin-bottom: 16px;">
          <div class="student-section-title"><i class="fa-solid fa-graduation-cap"></i> Education & Academics</div>
          ${r.education.map(edu => `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px;">
                <span>${this.escapeHtml(edu.college)}</span>
                <span style="font-size: 11px; color: #64748b;">${edu.startYear} - ${edu.endYear}</span>
              </div>
              <div style="font-size: 12px; color: #334155;">${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)} ${edu.cgpa ? `• GPA: ${edu.cgpa}` : ''}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.skills && r.skills.length) ? `
        <div style="margin-bottom: 16px;">
          <div class="student-section-title"><i class="fa-solid fa-code"></i> Technical Skills</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${r.skills.map(s => `<span class="resume-skill-badge">${this.escapeHtml(s.name)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${(r.projects && r.projects.length) ? `
        <div style="margin-bottom: 16px;">
          <div class="student-section-title"><i class="fa-solid fa-laptop-code"></i> Academic & Personal Projects</div>
          ${r.projects.map(proj => `
            <div class="resume-entry">
              <div class="resume-entry-header">
                <span class="resume-entry-title">${this.escapeHtml(proj.name)}</span>
                ${proj.technologies ? `<span style="font-size: 11px; color: ${accent}; font-weight: 600;">${this.escapeHtml(proj.technologies)}</span>` : ''}
              </div>
              <div class="resume-entry-desc">${this.escapeHtml(proj.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.experience && r.experience.length) ? `
        <div>
          <div class="student-section-title"><i class="fa-solid fa-briefcase"></i> Internships & Experience</div>
          ${r.experience.map(exp => `
            <div class="resume-entry">
              <div class="resume-entry-header">
                <span class="resume-entry-title">${this.escapeHtml(exp.role)} – ${this.escapeHtml(exp.company)}</span>
                <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div class="resume-entry-desc">${this.escapeHtml(exp.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  // 6. MINIMAL TEMPLATE
  templateMinimal(r, p) {
    return `
      <div style="margin-bottom: 24px;">
        <h1>${this.escapeHtml(p.fullName || 'Your Name')}</h1>
        <div class="minimal-title">${this.escapeHtml(p.jobTitle || 'Profession')}</div>
        <div style="font-size: 12px; color: #64748b; display: flex; gap: 14px; flex-wrap: wrap;">
          ${p.email ? `<span>${this.escapeHtml(p.email)}</span>` : ''}
          ${p.phone ? `<span>${this.escapeHtml(p.phone)}</span>` : ''}
          ${p.address ? `<span>${this.escapeHtml(p.address)}</span>` : ''}
        </div>
      </div>

      ${r.summary ? `
        <div class="minimal-section">
          <div class="minimal-section-title">About</div>
          <div style="font-size: 12.5px; line-height: 1.6;">${this.escapeHtml(r.summary)}</div>
        </div>
      ` : ''}

      ${(r.experience && r.experience.length) ? `
        <div class="minimal-section">
          <div class="minimal-section-title">Experience</div>
          <div>
            ${r.experience.map(exp => `
              <div style="margin-bottom: 14px;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${this.escapeHtml(exp.role)} – ${this.escapeHtml(exp.company)}</div>
                <div style="font-size: 11.5px; color: #94a3b8;">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</div>
                <div style="font-size: 12px; margin-top: 4px; color: #475569;">${this.escapeHtml(exp.description)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(r.education && r.education.length) ? `
        <div class="minimal-section">
          <div class="minimal-section-title">Education</div>
          <div>
            ${r.education.map(edu => `
              <div style="margin-bottom: 8px;">
                <div style="font-weight: 700; font-size: 12.5px;">${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</div>
                <div style="font-size: 11.5px; color: #64748b;">${this.escapeHtml(edu.college)} (${edu.startYear} – ${edu.endYear})</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(r.skills && r.skills.length) ? `
        <div class="minimal-section">
          <div class="minimal-section-title">Skills</div>
          <div style="font-size: 12px; line-height: 1.6;">
            ${r.skills.map(s => this.escapeHtml(s.name)).join(', ')}
          </div>
        </div>
      ` : ''}
    `;
  },

  // 7. ELEGANT TEMPLATE
  templateElegant(r, p, accent) {
    return `
      <div class="elegant-header">
        <h1>${this.escapeHtml(p.fullName || 'Your Name')}</h1>
        <div style="font-size: 14px; font-weight: 600; color: ${accent}; text-transform: uppercase; letter-spacing: 0.1em;">${this.escapeHtml(p.jobTitle || 'Executive')}</div>
        <div class="elegant-accent-line"></div>
        <div style="font-size: 12px; color: #64748b; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
          ${p.email ? `<span>${this.escapeHtml(p.email)}</span>` : ''}
          ${p.phone ? `<span>${this.escapeHtml(p.phone)}</span>` : ''}
          ${p.address ? `<span>${this.escapeHtml(p.address)}</span>` : ''}
        </div>
      </div>

      <div class="elegant-grid">
        <div>
          ${r.summary ? `
            <div style="margin-bottom: 18px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-bottom: 8px;">Executive Profile</h3>
              <p style="font-size: 12.5px; line-height: 1.55; color: #334155;">${this.escapeHtml(r.summary)}</p>
            </div>
          ` : ''}

          ${(r.experience && r.experience.length) ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-bottom: 10px;">Experience</h3>
              ${r.experience.map(exp => `
                <div class="resume-entry">
                  <div class="resume-entry-header">
                    <span class="resume-entry-title">${this.escapeHtml(exp.role)}</span>
                    <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: ${accent};">${this.escapeHtml(exp.company)}</div>
                  <div class="resume-entry-desc">${this.escapeHtml(exp.description)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          ${(r.skills && r.skills.length) ? `
            <div style="margin-bottom: 18px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-bottom: 8px;">Expertise</h3>
              ${r.skills.map(s => `<div style="font-size: 11.5px; margin-bottom: 3px; font-weight: 600;">• ${this.escapeHtml(s.name)}</div>`).join('')}
            </div>
          ` : ''}

          ${(r.education && r.education.length) ? `
            <div>
              <h3 style="font-size: 13px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-bottom: 8px;">Education</h3>
              ${r.education.map(edu => `
                <div style="font-size: 12px; margin-bottom: 8px;">
                  <strong>${this.escapeHtml(edu.degree)}</strong>
                  <div style="color: #64748b; font-size: 11px;">${this.escapeHtml(edu.college)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // 8. PROFESSIONAL TEMPLATE
  templateProfessional(r, p, accent) {
    return `
      <div class="prof-top">
        <div>
          <h1>${this.escapeHtml(p.fullName || 'Your Name')}</h1>
          <div style="font-size: 15px; font-weight: 700; color: ${accent};">${this.escapeHtml(p.jobTitle || 'Professional Role')}</div>
        </div>
        <div style="font-size: 12px; text-align: right; color: #475569;">
          ${p.email ? `<div>${this.escapeHtml(p.email)}</div>` : ''}
          ${p.phone ? `<div>${this.escapeHtml(p.phone)}</div>` : ''}
          ${p.address ? `<div>${this.escapeHtml(p.address)}</div>` : ''}
        </div>
      </div>

      <div class="prof-columns">
        <div>
          ${r.summary ? `
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Profile Summary</h3>
              <p style="font-size: 12px; line-height: 1.5; color: #334155;">${this.escapeHtml(r.summary)}</p>
            </div>
          ` : ''}

          ${(r.experience && r.experience.length) ? `
            <div style="margin-bottom: 18px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px;">Experience</h3>
              ${r.experience.map(exp => `
                <div class="resume-entry">
                  <div class="resume-entry-header">
                    <span class="resume-entry-title">${this.escapeHtml(exp.role)} – ${this.escapeHtml(exp.company)}</span>
                    <span class="resume-entry-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div class="resume-entry-desc">${this.escapeHtml(exp.description)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(r.projects && r.projects.length) ? `
            <div>
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px;">Projects</h3>
              ${r.projects.map(proj => `
                <div class="resume-entry">
                  <div class="resume-entry-title">${this.escapeHtml(proj.name)}</div>
                  <div class="resume-entry-desc">${this.escapeHtml(proj.description)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          ${(r.skills && r.skills.length) ? `
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Skills</h3>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${r.skills.map(s => `<span class="resume-skill-badge">${this.escapeHtml(s.name)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${(r.education && r.education.length) ? `
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Education</h3>
              ${r.education.map(edu => `
                <div style="font-size: 12px; margin-bottom: 6px;">
                  <strong>${this.escapeHtml(edu.degree)}</strong>
                  <div style="color: #64748b;">${this.escapeHtml(edu.college)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(r.certifications && r.certifications.length) ? `
            <div>
              <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Certifications</h3>
              ${r.certifications.map(c => `
                <div style="font-size: 11.5px; margin-bottom: 4px;"><strong>${this.escapeHtml(c.name)}</strong></div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // 9. CORPORATE TEMPLATE
  templateCorporate(r, p, accent) {
    return `
      <div style="border-bottom: 3px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>${this.escapeHtml(p.fullName || 'Corporate Executive')}</h1>
          <div style="font-size: 14.5px; font-weight: 700; color: ${accent};">${this.escapeHtml(p.jobTitle || 'Senior Director')}</div>
        </div>
        <div style="font-size: 12px; text-align: right; color: #475569;">
          ${p.email ? `<div>${this.escapeHtml(p.email)}</div>` : ''}
          ${p.phone ? `<div>${this.escapeHtml(p.phone)}</div>` : ''}
        </div>
      </div>

      ${r.summary ? `
        <div class="corp-box">
          <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: ${accent}; margin-bottom: 4px;">Executive Summary</div>
          <p style="font-size: 12px; line-height: 1.5;">${this.escapeHtml(r.summary)}</p>
        </div>
      ` : ''}

      ${(r.experience && r.experience.length) ? `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1e1b4b; margin-bottom: 10px;">Professional History</h3>
          ${r.experience.map(exp => `
            <div class="corp-box" style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 13px;">
                <span>${this.escapeHtml(exp.role)} – ${this.escapeHtml(exp.company)}</span>
                <span style="font-size: 11px; color: #64748b;">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div style="font-size: 12px; margin-top: 4px;">${this.escapeHtml(exp.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.education && r.education.length) ? `
        <div class="corp-box">
          <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: ${accent}; margin-bottom: 6px;">Education & Credentials</div>
          ${r.education.map(edu => `
            <div style="font-size: 12px; margin-bottom: 4px;">
              <strong>${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</strong> – ${this.escapeHtml(edu.college)} (${edu.startYear} - ${edu.endYear})
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  // 10. FRESHER TEMPLATE
  templateFresher(r, p, accent) {
    return `
      <div class="fresher-banner">
        <h1>${this.escapeHtml(p.fullName || 'Your Name')}</h1>
        <div style="font-size: 14.5px; font-weight: 700; color: ${accent}; margin-top: 4px;">${this.escapeHtml(p.jobTitle || 'Entry Level Professional')}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
          ${p.email ? `<span><i class="fa-regular fa-envelope"></i> ${this.escapeHtml(p.email)}</span>` : ''}
          ${p.phone ? `<span><i class="fa-solid fa-phone"></i> ${this.escapeHtml(p.phone)}</span>` : ''}
          ${p.github ? `<span><i class="fa-brands fa-github"></i> ${this.escapeHtml(p.github)}</span>` : ''}
        </div>
      </div>

      ${r.summary ? `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">Career Objective</h3>
          <p style="font-size: 12px; line-height: 1.5; color: #334155;">${this.escapeHtml(r.summary)}</p>
        </div>
      ` : ''}

      ${(r.skills && r.skills.length) ? `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Technical & Soft Skills</h3>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${r.skills.map(s => `<span class="resume-skill-badge" style="background: rgba(5, 150, 105, 0.1); color: #059669; font-weight: 700;">${this.escapeHtml(s.name)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${(r.projects && r.projects.length) ? `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Academic & Personal Projects</h3>
          ${r.projects.map(proj => `
            <div class="resume-entry">
              <div class="resume-entry-header">
                <span class="resume-entry-title">${this.escapeHtml(proj.name)}</span>
                ${proj.technologies ? `<span style="font-size: 11px; color: ${accent};">${this.escapeHtml(proj.technologies)}</span>` : ''}
              </div>
              <div class="resume-entry-desc">${this.escapeHtml(proj.description)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.education && r.education.length) ? `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Education</h3>
          ${r.education.map(edu => `
            <div style="margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700;">
                <span>${this.escapeHtml(edu.degree)} in ${this.escapeHtml(edu.branch)}</span>
                <span style="font-size: 11px; color: #64748b;">${edu.startYear} - ${edu.endYear}</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b;">${this.escapeHtml(edu.college)} ${edu.cgpa ? `• GPA: ${edu.cgpa}` : ''}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${(r.certifications && r.certifications.length) ? `
        <div>
          <h3 style="font-size: 13px; font-weight: 800; color: ${accent}; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">Certifications</h3>
          ${r.certifications.map(c => `<div style="font-size: 11.5px;">• ${this.escapeHtml(c.name)} (${c.year})</div>`).join('')}
        </div>
      ` : ''}
    `;
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
