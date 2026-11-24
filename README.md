# Resume Builder – Professional Resume Creator

A fully responsive, modern, premium-looking SaaS web application built with **semantic HTML5**, **CSS3**, and **Vanilla JavaScript (ES6)**.

---

## 🌟 Key Features

- **No Frameworks / Dependencies Required**: Built purely using standard web technologies (HTML5, CSS3, ES6 JavaScript, Google Fonts, and Font Awesome).
- **LocalStorage Data Engine**: 100% offline-ready and private. Full CRUD support for resumes, user authentication, bookmarks, and settings.
- **10 Curated Resume Templates**:
  1. **Modern**: 2-column layout with sidebar and elegant accents.
  2. **ATS Friendly**: Single-column high parsing score layout for automated tracking systems.
  3. **Creative**: Bold header banner, vibrant tags, portfolio-first structure.
  4. **Executive**: Sophisticated serif typography, leadership & milestone-driven.
  5. **Student**: Education-first, coursework, extracurriculars & projects.
  6. **Minimal**: Clean Scandinavian monochrome aesthetic with generous whitespace.
  7. **Elegant**: Navy and gold accents, stylish section dividers, timeline markers.
  8. **Professional**: Standard corporate two-column format.
  9. **Corporate**: Structured border blocks with KPI metrics styling.
  10. **Fresher**: Focused on technical skills, projects, and certifications.
- **Real-Time Split-Screen Live Preview**: Every keystroke instantly reflects on the A4 canvas.
- **10-Step Guided Wizard**:
  - Step 1: Personal Information & Photo Upload
  - Step 2: Professional Summary & AI Suggestions
  - Step 3: Education History (Dynamic Cards)
  - Step 4: Work Experience & Achievements (Dynamic Cards)
  - Step 5: Skills & Proficiency Levels (Tags & Suggestions)
  - Step 6: Key Projects (Dynamic Cards)
  - Step 7: Certifications & Licenses (Dynamic Cards)
  - Step 8: Languages & Fluency (Dynamic List)
  - Step 9: Interests & Hobbies (Dynamic Badges)
  - Step 10: Preview, Customization & PDF Export
- **One-Click PDF Export**: Uses clean `@media print` CSS for pixel-perfect A4 printing without browser headers or margins.
- **Dark & Light Mode**: Seamless theme switching persisted in LocalStorage.
- **Mobile Responsive Design**: Features an automatic mobile switcher (`[Edit Form]` vs `[Live Preview]`) and offcanvas navigation drawer.
- **Pre-Seeded Demo Account**: Comes pre-populated with sample user *Alex Morgan* and 3 complete resumes.

---

## 📁 Project Structure

```
resume-builder/
│
├── index.html              # Landing Page
├── login.html              # Sign In Page (with Demo Auto-fill)
├── register.html           # Sign Up Page (with Password Strength Meter)
├── dashboard.html          # Dashboard Overview with Stats & Metrics
├── resume-builder.html     # 10-Step Wizard & Live Preview Canvas
├── templates.html          # 10 Template Cards Gallery & Modal Preview
├── my-resumes.html         # Saved Resumes Collection & CRUD Actions
├── settings.html           # User Profile, Theme & Data Backup
│
├── css/
│   ├── style.css           # Design System, Glassmorphism, Theme Variables
│   ├── dashboard.css       # App Shell, Sidebar, Metrics, Tables
│   ├── resume.css          # Multi-Step Wizard, 10 Template Styles, Print CSS
│   ├── responsive.css      # Tablet & Mobile Breakpoints, Drawer Sidebar
│
├── js/
│   ├── storage.js          # LocalStorage Manager & Initial Data Seeder
│   ├── auth.js             # Authentication, Validation & Route Guards
│   ├── app.js              # Global Toasts, Confirm Modals, Theme Toggler
│   ├── dashboard.js        # Dashboard Metrics & Recent Resumes
│   ├── resume.js           # Multi-Step Wizard & Live Template Renderer
│   ├── templates.js        # Template Catalog, Filtering & Favorites
│   ├── my-resumes.js       # Resumes Collection, Sorting & Filtering
│   ├── settings.js         # User Profile, Avatar Upload & JSON Backup
│
├── images/                 # Image Assets
├── icons/                  # Icon Assets
└── assets/                 # Shared Assets
```

---

## 🚀 How to Run

1. Open `index.html` in any modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).
2. Or use any static file server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Test Demo Credentials:
   - **Email**: `alex.morgan@example.com`
   - **Password**: `Password123`
   - *(Or click the **"Autofill Demo Account"** button on the Sign In page for one-click access!)*
