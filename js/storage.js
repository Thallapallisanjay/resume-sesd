/**
 * Resume Builder - LocalStorage & Data Management Engine
 * Handles user authentication storage, resume CRUD operations, template bookmarks, and initial seeding.
 */

const STORAGE_KEYS = {
  USERS: 'rb_users',
  CURRENT_USER: 'rb_current_user',
  RESUMES: 'rb_resumes',
  FAVORITES: 'rb_favorites',
  THEME: 'rb_theme',
  SETTINGS: 'rb_settings',
  DOWNLOADS_COUNT: 'rb_downloads_count'
};

// Initial Seed Data for Instant Experience
const SEED_USERS = [
  {
    id: 'usr_demo_101',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    password: 'Password123',
    jobTitle: 'Senior Full Stack Engineer',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    bio: 'Passionate software engineer with 6+ years of experience crafting resilient cloud platforms, modern web apps, and user-centric digital experiences.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_RESUMES = [
  {
    id: 'res_sample_001',
    userId: 'usr_demo_101',
    title: 'Senior Full Stack Engineer - 2026',
    template: 'modern',
    themeColor: '#4f46e5',
    fontFamily: 'Inter',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    personal: {
      fullName: 'Alex Morgan',
      jobTitle: 'Senior Full Stack Engineer',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      address: 'San Francisco, CA, USA',
      linkedin: 'linkedin.com/in/alexmorgan-dev',
      github: 'github.com/alexmorgan-tech',
      portfolio: 'alexmorgan.dev',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    },
    summary: 'Results-driven Senior Full Stack Engineer with over 6 years of experience architecting scalable distributed systems and responsive modern web applications. Expert in TypeScript, React, Node.js, and cloud native architectures. Proven record of optimizing web performance by 45% and leading high-velocity engineering squads.',
    education: [
      {
        id: 'edu_1',
        college: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        cgpa: '3.85 / 4.0',
        startYear: '2016',
        endYear: '2020'
      }
    ],
    experience: [
      {
        id: 'exp_1',
        company: 'CloudScale Technologies',
        role: 'Senior Full Stack Engineer',
        location: 'San Francisco, CA',
        startDate: 'Jan 2023',
        endDate: 'Present',
        current: true,
        description: '• Architected and migrated legacy monolith to modular microservices handling 12M+ monthly active requests.\n• Reduced frontend bundle size and improved Core Web Vitals resulting in 42% faster load times.\n• Mentored 8 junior and mid-level engineers, instituting code review standards and CI/CD best practices.'
      },
      {
        id: 'exp_2',
        company: 'Vanguard Digital Solutions',
        role: 'Full Stack Web Developer',
        location: 'Oakland, CA',
        startDate: 'Aug 2020',
        endDate: 'Dec 2022',
        current: false,
        description: '• Spearheaded frontend engineering for flagship enterprise SaaS product using React, TypeScript, and Tailwind CSS.\n• Designed RESTful and GraphQL APIs with Node.js and PostgreSQL with 99.98% uptime SLA.\n• Implemented real-time collaboration canvas using WebSockets and Redis Pub/Sub.'
      }
    ],
    skills: [
      { name: 'JavaScript / TypeScript', level: 'Expert', category: 'Technical' },
      { name: 'React & Next.js', level: 'Expert', category: 'Technical' },
      { name: 'Node.js & Express', level: 'Advanced', category: 'Technical' },
      { name: 'PostgreSQL & MongoDB', level: 'Advanced', category: 'Technical' },
      { name: 'AWS & Docker', level: 'Intermediate', category: 'Technical' },
      { name: 'System Architecture', level: 'Advanced', category: 'Soft skills' },
      { name: 'Agile Leadership', level: 'Advanced', category: 'Soft skills' }
    ],
    projects: [
      {
        id: 'proj_1',
        name: 'Nexus Flow - Realtime Collaborative Kanban',
        description: 'High-performance team management suite featuring drag-and-drop workflow automation, live updates, and analytical dashboards.',
        technologies: 'React, Node.js, Socket.io, Tailwind CSS, PostgreSQL',
        github: 'https://github.com/alexmorgan-tech/nexus-flow',
        liveUrl: 'https://nexusflow-demo.dev'
      },
      {
        id: 'proj_2',
        name: 'PulseMetrics - Cloud Telemetry Visualizer',
        description: 'Lightweight monitoring dashboard parsing server performance telemetry and generating real-time anomaly alerts.',
        technologies: 'TypeScript, Go, TimescaleDB, Chart.js',
        github: 'https://github.com/alexmorgan-tech/pulse-metrics',
        liveUrl: 'https://pulsemetrics.live'
      }
    ],
    certifications: [
      {
        id: 'cert_1',
        name: 'AWS Certified Solutions Architect – Associate',
        organization: 'Amazon Web Services',
        year: '2023',
        url: 'https://aws.amazon.com/certification'
      },
      {
        id: 'cert_2',
        name: 'Professional Scrum Master I (PSM I)',
        organization: 'Scrum.org',
        year: '2022',
        url: 'https://scrum.org'
      }
    ],
    languages: [
      { name: 'English', proficiency: 'Native / Bilingual' },
      { name: 'Spanish', proficiency: 'Professional Working' },
      { name: 'German', proficiency: 'Elementary' }
    ],
    interests: ['Open Source Contributing', 'Distributed Systems', 'Marathon Running', 'UI/UX Design', 'Podcasting']
  },
  {
    id: 'res_sample_002',
    userId: 'usr_demo_101',
    title: 'Lead Product Manager - Executive',
    template: 'executive',
    themeColor: '#0f766e',
    fontFamily: 'Merriweather',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    personal: {
      fullName: 'Alex Morgan',
      jobTitle: 'Lead Product Manager',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      address: 'San Francisco, CA, USA',
      linkedin: 'linkedin.com/in/alexmorgan-dev',
      github: '',
      portfolio: 'alexmorgan.dev',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    },
    summary: 'Strategic Product Leader with 7+ years of track record driving product vision, high-impact roadmaps, and cross-functional execution for hyper-growth enterprise and consumer technology platforms. Generated over $18M in ARR growth through data-informed product discovery and customer-centric iteration.',
    education: [
      {
        id: 'edu_2',
        college: 'Stanford Graduate School of Business',
        degree: 'Master of Business Administration (MBA)',
        branch: 'Product Strategy & Innovation',
        cgpa: '3.9 / 4.0',
        startYear: '2019',
        endYear: '2021'
      }
    ],
    experience: [
      {
        id: 'exp_3',
        company: 'Apex SaaS Platforms',
        role: 'Lead Product Manager',
        location: 'San Francisco, CA',
        startDate: 'Jan 2022',
        endDate: 'Present',
        current: true,
        description: '• Directed product roadmap for core subscription engine generating $34M in annual revenue with 120% net retention.\n• Formulated product metrics framework (OKRs, North Star metric, user funnel drop-offs).\n• Partnered directly with engineering, marketing, and sales leadership across 4 geographic regions.'
      }
    ],
    skills: [
      { name: 'Product Strategy & Roadmapping', level: 'Expert', category: 'Technical' },
      { name: 'Customer Discovery & UX Research', level: 'Expert', category: 'Technical' },
      { name: 'Data Analytics & SQL', level: 'Advanced', category: 'Technical' },
      { name: 'A/B Testing & Conversion Optimization', level: 'Advanced', category: 'Technical' },
      { name: 'Cross-functional Leadership', level: 'Expert', category: 'Soft skills' }
    ],
    projects: [
      {
        id: 'proj_3',
        name: 'Enterprise Self-Serve Onboarding Flow',
        description: 'Revamped self-guided enterprise onboarding funnel increasing customer activation rate from 18% to 41% within 90 days.',
        technologies: 'Mixpanel, Amplitude, Figma, Segment',
        github: '',
        liveUrl: 'https://apexplatform.com/tour'
      }
    ],
    certifications: [
      {
        id: 'cert_3',
        name: 'Certified Product Manager (CPM)',
        organization: 'AIPMM',
        year: '2021',
        url: ''
      }
    ],
    languages: [
      { name: 'English', proficiency: 'Native' },
      { name: 'French', proficiency: 'Conversational' }
    ],
    interests: ['Angel Investing', 'Tech Policy', 'Modern Art', 'Chess']
  },
  {
    id: 'res_sample_003',
    userId: 'usr_demo_101',
    title: 'ATS-Optimized Technical Resume',
    template: 'ats',
    themeColor: '#1e293b',
    fontFamily: 'Inter',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    personal: {
      fullName: 'Alex Morgan',
      jobTitle: 'Software Engineer',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      address: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/alexmorgan-dev',
      github: 'github.com/alexmorgan-tech',
      portfolio: 'alexmorgan.dev',
      photo: ''
    },
    summary: 'Dedicated and detail-oriented Software Engineer with robust expertise in frontend web development, REST API design, database architecture, and automated test pipelines. Strong analytical problem solver with continuous learning mindset.',
    education: [
      {
        id: 'edu_3',
        college: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        cgpa: '3.85 / 4.0',
        startYear: '2016',
        endYear: '2020'
      }
    ],
    experience: [
      {
        id: 'exp_4',
        company: 'CloudScale Technologies',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        description: '• Developed 15+ reusable responsive UI components in React and TypeScript.\n• Improved API response latency by 35% using server-side caching and indexed PostgreSQL queries.\n• Wrote end-to-end integration tests using Jest and Playwright ensuring 94% test coverage.'
      }
    ],
    skills: [
      { name: 'JavaScript / TypeScript', level: 'Advanced', category: 'Technical' },
      { name: 'HTML5 & CSS3', level: 'Expert', category: 'Technical' },
      { name: 'React.js', level: 'Advanced', category: 'Technical' },
      { name: 'Node.js', level: 'Intermediate', category: 'Technical' },
      { name: 'Git & GitHub', level: 'Advanced', category: 'Technical' },
      { name: 'Problem Solving', level: 'Advanced', category: 'Soft skills' }
    ],
    projects: [
      {
        id: 'proj_4',
        name: 'TaskMaster Pro',
        description: 'Interactive productivity application featuring localized storage, tag filtering, and priority queues.',
        technologies: 'JavaScript, CSS Grid, LocalStorage',
        github: 'https://github.com/alexmorgan-tech/taskmaster',
        liveUrl: ''
      }
    ],
    certifications: [
      {
        id: 'cert_4',
        name: 'Meta Front-End Developer Professional Certificate',
        organization: 'Coursera / Meta',
        year: '2021',
        url: ''
      }
    ],
    languages: [
      { name: 'English', proficiency: 'Native' }
    ],
    interests: ['Web Accessibility', 'Open Source Software', 'Cycling']
  }
];

class StorageManager {
  static init() {
    // Seed default users if not present
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    // Seed default current user if not logged in
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[0]));
    }
    // Seed sample resumes if empty
    if (!localStorage.getItem(STORAGE_KEYS.RESUMES)) {
      localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(SEED_RESUMES));
    }
    // Seed favorites if empty
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(['modern', 'creative', 'ats']));
    }
    // Seed theme
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem(STORAGE_KEYS.THEME, prefersDark ? 'dark' : 'light');
    }
    // Seed download counter
    if (!localStorage.getItem(STORAGE_KEYS.DOWNLOADS_COUNT)) {
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS_COUNT, '18');
    }
  }

  // --- Auth & Users ---
  static getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  }

  static getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
      return user || null;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static registerUser({ name, email, password }) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      jobTitle: 'Professional',
      phone: '',
      location: '',
      bio: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  }

  static loginUser(email, password) {
    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  static logoutUser() {
    this.setCurrentUser(null);
  }

  static updateUserProfile(updatedFields) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);

    const mergedUser = { ...currentUser, ...updatedFields };

    if (index !== -1) {
      users[index] = mergedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    this.setCurrentUser(mergedUser);
    return { success: true, user: mergedUser };
  }

  // --- Resumes CRUD ---
  static getResumes() {
    try {
      const resumes = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESUMES)) || [];
      const user = this.getCurrentUser();
      if (!user) return resumes;
      // Filter for current user, or return all sample resumes if matched
      return resumes.filter(r => !r.userId || r.userId === user.id || r.userId === 'usr_demo_101');
    } catch {
      return [];
    }
  }

  static getAllResumesRaw() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESUMES)) || [];
    } catch {
      return [];
    }
  }

  static getResumeById(id) {
    const resumes = this.getAllResumesRaw();
    return resumes.find(r => r.id === id) || null;
  }

  static saveResume(resumeData) {
    const resumes = this.getAllResumesRaw();
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    if (resumeData.id) {
      // Update existing
      const index = resumes.findIndex(r => r.id === resumeData.id);
      if (index !== -1) {
        resumes[index] = {
          ...resumes[index],
          ...resumeData,
          updatedAt: now
        };
        localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
        return resumes[index];
      }
    }

    // Create new
    const newResume = {
      ...resumeData,
      id: 'res_' + Date.now(),
      userId: currentUser ? currentUser.id : 'usr_demo_101',
      createdAt: now,
      updatedAt: now
    };

    resumes.unshift(newResume);
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
    return newResume;
  }

  static deleteResume(id) {
    let resumes = this.getAllResumesRaw();
    resumes = resumes.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
    return true;
  }

  static duplicateResume(id) {
    const resume = this.getResumeById(id);
    if (!resume) return null;

    const duplicate = JSON.parse(JSON.stringify(resume));
    duplicate.id = 'res_' + Date.now();
    duplicate.title = `${duplicate.title} (Copy)`;
    duplicate.createdAt = new Date().toISOString();
    duplicate.updatedAt = new Date().toISOString();

    const resumes = this.getAllResumesRaw();
    resumes.unshift(duplicate);
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
    return duplicate;
  }

  // --- Template Favorites ---
  static getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(templateId) {
    let favorites = this.getFavorites();
    if (favorites.includes(templateId)) {
      favorites = favorites.filter(id => id !== templateId);
    } else {
      favorites.push(templateId);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites;
  }

  static isFavorite(templateId) {
    const favorites = this.getFavorites();
    return favorites.includes(templateId);
  }

  // --- Stats and Downloads ---
  static getDownloadsCount() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.DOWNLOADS_COUNT) || '18', 10);
  }

  static incrementDownloadCount() {
    const current = this.getDownloadsCount();
    const updated = current + 1;
    localStorage.setItem(STORAGE_KEYS.DOWNLOADS_COUNT, updated.toString());
    return updated;
  }

  // --- Theme ---
  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // --- Backup Export / Import ---
  static exportAllData() {
    const data = {
      users: this.getUsers(),
      currentUser: this.getCurrentUser(),
      resumes: this.getAllResumesRaw(),
      favorites: this.getFavorites(),
      theme: this.getTheme(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.currentUser) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.currentUser));
      if (data.resumes) localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(data.resumes));
      if (data.favorites) localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites));
      if (data.theme) localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  static resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.RESUMES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    this.init();
  }
}

// Auto-initialize storage on load
StorageManager.init();
