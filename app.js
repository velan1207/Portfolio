// Simple client-side portfolio editor with demo email check and localStorage persistence
(() => {
  const DEMO_EMAIL = 'velanm.cse2024@citchennai.net';
  // Admin allowed email(s) - update as appropriate
  const ADMIN_ALLOWED_EMAIL = DEMO_EMAIL;
  const STORAGE_KEY = 'portfolio:data:v1';

  // Elements (index.html)
  const nameEl = document.getElementById('name');
  const headlineEl = document.getElementById('headline');
  const aboutEl = document.getElementById('about-text');
  const techSkillsListEl = document.getElementById('tech-skills-list');
  const softSkillsListEl = document.getElementById('soft-skills-list');
  const projectsListEl = document.getElementById('projects-list');
  
  const resumeSection = document.getElementById('resume');
  const contactSection = document.getElementById('contact');
  const skillsModal = document.getElementById('skills-modal');
  const skillsModalList = document.getElementById('skills-modal-list');
  const skillsModalClose = document.getElementById('skills-modal-close');
  const skillsModalOverlay = document.getElementById('skills-modal-overlay');
  let skillsModalWired = false;

  // Elements (admin.html)
  const emailInput = document.getElementById('email');
  const loginBtn = document.getElementById('login-btn');
  const loginMsg = document.getElementById('login-msg');
  const editorSection = document.getElementById('editor');
  const nameInput = document.getElementById('name-input');
  const headlineInput = document.getElementById('headline-input');
  const aboutInput = document.getElementById('about-input');
  const projectsEditor = document.getElementById('projects-editor');
  const addProjectBtn = document.getElementById('add-project');
  const techSkillsEditor = document.getElementById('tech-skills-editor');
  const addTechSkillBtn = document.getElementById('add-tech-skill');
  const softSkillsEditor = document.getElementById('soft-skills-editor');
  const addSoftSkillBtn = document.getElementById('add-soft-skill');
  const internshipsEditor = document.getElementById('internships-editor');
  const addInternshipBtn = document.getElementById('add-internship');
  
  const resumeLinkInput = document.getElementById('resume-link');
  const contactEmail = document.getElementById('contact-email');
  const contactPhone = document.getElementById('contact-phone');
  const contactLinkedIn = document.getElementById('contact-linkedin');
  const profileImageUrlInput = document.getElementById('profile-image-url');
  const profileImageFileInput = document.getElementById('profile-image-file');
  const profileImagePreview = document.getElementById('profile-image-preview');
  const profileImageCaptionInput = document.getElementById('profile-image-caption');
  const saveBtn = document.getElementById('save-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const importBtn = document.getElementById('import-btn');

  // Google OAuth client id will be loaded from google-config.json served by the dev server.
  let GOOGLE_CLIENT_ID = null;
  // Admin theme selector (admin page only)
  const adminThemeSelect = document.querySelector('select#theme-select');

  // --- Firebase / Firestore realtime sync ---
  // NOTE: This uses the compat SDK loaded in admin.html/index.html. Ensure the SDK script tags are present.
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD0KmDOYkBgaWmherPgupciFlrUNoTpL1s",
    authDomain: "portfolio-f1b31.firebaseapp.com",
    projectId: "portfolio-f1b31",
    storageBucket: "portfolio-f1b31.firebasestorage.app",
    messagingSenderId: "831274339687",
    appId: "1:831274339687:web:8fb7be5fdc341ec41033c2",
    measurementId: "G-69W84YT32Q"
  };

  let firestore = null;
  // Collection / doc refs
  let metaDocRef = null; // portfolio_meta/main -> name/headline/about/profile/resume/contact
  let projectsColRef = null; // portfolio_projects
  let internshipsColRef = null; // portfolio_internships
  let skillsColRef = null; // portfolio_skills (type: 'technical'|'soft')
  let achievementsColRef = null; // portfolio_achievements
  // legacy single-doc ref (used only for migration/fallback)
  let legacyDocRef = null;
  try{
    if(window.firebase && typeof window.firebase.initializeApp === 'function'){
      try{ firebase.initializeApp(FIREBASE_CONFIG); }catch(e){}
      try{
        firestore = firebase.firestore();
        // new collections-based layout
        metaDocRef = firestore.collection('portfolio_meta').doc('main');
        projectsColRef = firestore.collection('portfolio_projects');
        internshipsColRef = firestore.collection('portfolio_internships');
        skillsColRef = firestore.collection('portfolio_skills');
        achievementsColRef = firestore.collection('portfolio_achievements');
        // legacy single-doc kept for migration fallback
        legacyDocRef = firestore.collection('portfolio').doc('data-v1');
      }catch(e){ console.warn('Firestore init failed', e); }
    }
  }catch(e){ console.warn('Firebase not available', e); }

  // --- Firebase Auth & Storage (compat) wiring ---
  let firebaseAuth = null;
  let firebaseStorage = null;
  try{
    if(window.firebase && typeof window.firebase.auth === 'function'){
      try{ firebaseAuth = firebase.auth(); }catch(e){ console.warn('Auth init failed', e); }
    }
    if(window.firebase && typeof window.firebase.storage === 'function'){
      try{ firebaseStorage = firebase.storage(); }catch(e){ console.warn('Storage init failed', e); }
    }
  }catch(e){ /* ignore */ }

  // UI elements used for auth
  const firebaseSignInContainer = document.getElementById('g_id_signin');

  // Sign out helper (UI-level)
  async function signOutUser(){
    try{ if(firebaseAuth) await firebaseAuth.signOut(); }catch(e){}
    // show login area
    const loginSection = document.querySelector('.login'); if(loginSection) loginSection.classList.remove('hidden');
    const banner = document.getElementById('signed-in-banner'); if(banner) banner.classList.add('hidden');
    editorSection.classList.add('hidden');
  }

  // Upload profile image file to Firebase Storage if a File was selected. Returns download URL or original value.
  async function uploadProfileImageIfNeeded(data){
    // If a file input contains a File, upload to storage and return its download URL. Otherwise return data.profile.image.
    try{
      const fileInput = profileImageFileInput;
      if(!fileInput || !fileInput.files || fileInput.files.length === 0) return data.profile && data.profile.image || '';
      const file = fileInput.files[0];
      if(!file || !firebaseStorage) return data.profile && data.profile.image || '';
      const ext = file.name.split('.').pop();
      const path = `profile-images/${Date.now()}_${Math.random().toString(36).slice(2,9)}.${ext}`;
      const ref = firebaseStorage.ref().child(path);
      const snap = await ref.put(file);
      const url = await snap.ref.getDownloadURL();
      return url;
    }catch(e){ console.error('Profile image upload failed', e); return data.profile && data.profile.image || ''; }
  }

  // Upload a data URL (base64) to Firebase Storage and return the download URL.
  async function uploadDataUrlToStorage(dataUrl, ext){
    if(!firebaseStorage || !dataUrl) return null;
    try{
      // Convert data URL to blob (fetch works in modern browsers)
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const extension = ext || (blob.type && blob.type.split('/').pop()) || 'png';
      const path = `profile-images/${Date.now()}_${Math.random().toString(36).slice(2,9)}.${extension}`;
      const ref = firebaseStorage.ref().child(path);
      const snap = await ref.put(blob);
      const url = await snap.ref.getDownloadURL();
      return url;
    }catch(e){
      console.warn('uploadDataUrlToStorage failed', e);
      return null;
    }
  }

  // Compress a data URL (image) using a canvas. Returns a new data URL (jpeg) or original on failure.
  async function compressDataUrl(dataUrl, maxWidth = 1024, quality = 0.7){
    return new Promise((resolve)=>{
      try{
        const img = new Image();
        img.onload = ()=>{
          try{
            let w = img.width, h = img.height;
            if(w > maxWidth){
              h = Math.round(h * (maxWidth / w));
              w = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const newDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(newDataUrl);
          }catch(err){
            console.warn('compressDataUrl draw failed', err); resolve(dataUrl);
          }
        };
        img.onerror = ()=> { resolve(dataUrl); };
        // Ensure CORS-safe loading: data URLs are allowed
        img.src = dataUrl;
      }catch(e){ console.warn('compressDataUrl failed', e); resolve(dataUrl); }
    });
  }

  function defaultData(){
    return {
      name: 'Velan M',
      headline: 'Aspiring Software Engineer — Full-stack web & backend',
      about: '<p>Aspiring Software Engineer skilled in full-stack web development (React, Node), backend APIs and algorithms. Solved 400+ LeetCode and 900+ CodeChef problems. Practical experience building scalable web and mobile apps; seeking internships to contribute product-quality code.</p>',
      projects: [
        {title: 'PedalPulse — Urban Bike Rental Feedback App | Firebase, React, Node | Sep 2025', desc: '<p>Developed a web-based platform to collect and analyze feedback from urban bike rental users, allowing authorities to make data-driven decisions.</p><ul><li>Integrated Google Sign-In for secure user authentication and stored users’ ratings and comments for historical tracking.</li><li>Built an admin dashboard with charts, graphs, and CSV export to visualize trends in satisfaction, safety, and infrastructure usage.</li><li>Implemented Firebase backend for scalable storage, real-time updates, and secure data handling.</li><li>Planned future enhancements including IoT device telemetry, sentiment analysis, and predictive insights for operational improvements.</li></ul>'},
        {title: 'Weather Prediction Website | Node.js, OpenWeatherMap | Mar 2025', desc: '<p>Developed a responsive weather forecast website using a Node.js backend and the OpenWeatherMap API for live updates.</p><ul><li>Designed a mobile-first UI with intuitive layouts, allowing users to check weather conditions for multiple cities.</li><li>Implemented modular and scalable code architecture to facilitate feature updates like 7-day forecasts or hourly weather predictions.</li></ul>'},
        {title: 'To-Do List App | Flutter | Jun 2025', desc: '<p>Built a cross-platform to-do app using Flutter and Dart supporting task creation, categorization, and reminders.</p><ul><li>Implemented persistent local storage to save tasks offline and synchronized updates when internet is available.</li><li>Designed responsive UI with smooth navigation and offline support to enhance user experience.</li></ul>'},
        {title: 'Calculator App | Flutter | Jun 2025', desc: '<p>Developed a modern calculator app implementing BODMAS rules for accurate mathematical computations.</p><ul><li>Added input validation and smooth UI animations for better usability on mobile devices.</li><li>Built using Flutter/Dart to support both Android and iOS platforms.</li></ul>'},
        {title: 'Automatic Image Gallery | HTML, CSS | Feb 2025', desc: '<p>Designed a responsive web image gallery with automatic transitions for smooth slideshow display.</p><ul><li>Implemented adaptive layout for different screen sizes to ensure usability across devices.</li></ul>'}
      ],
      skills: {
        technical: [
          {name: 'C/C++', link: ''},
          {name: 'Python', link: ''},
          {name: 'Java', link: ''},
          {name: 'JavaScript', link: ''},
          {name: 'React.js', link: ''},
          {name: 'Node.js', link: ''},
          {name: 'Express.js', link: ''},
          {name: 'HTML', link: ''},
          {name: 'CSS', link: ''},
          {name: 'MySQL', link: ''},
          {name: 'Firebase', link: ''},
          {name: 'Git', link: ''},
          {name: 'Data Structures & Algorithms', link: ''}
        ],
        soft: [
          {name: 'Problem Solving', link: ''},
          {name: 'Teamwork', link: ''},
          {name: 'Communication', link: ''}
        ]
      },
      achievements: [
        'AWS Cloud Practitioner certification',
        'LinkedIn Learning: Web Development courses',
        'HackerRank and CodeChef problem solving (400+ LeetCode, 900+ CodeChef)',
        'Google Cloud / Hack2Skill challenges'
      ],
      internships: [
        {
          company: 'AICTE–EduSkills Virtual Internship',
          role: 'Android App Development Intern (Jun 2025)',
          text: '<ul><li>Built Flutter apps (calculator, to-do); implemented state management.</li><li>Used Git/GitHub for version control and deployments.</li></ul>',
          link: ''
        }
      ],
      profile: {
        image: 'img/velan.jpg', // data URL or relative URL
        caption: 'Student at Chennai Institute Of Technology'
      },
      resume: 'img/Velan_M_Resume 11-10-2025.pdf',
  contact: {email:'velanm.cse2024@citchennai.net', phone:'+91 7904092680', linkedin:'https://linkedin.com/in/velan-m', github:'https://github.com/velan1207'}
    };
  }

  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw? JSON.parse(raw): defaultData();
    }catch(e){
      console.error('Failed to load data', e);
      return defaultData();
    }
  }

  function saveData(data){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }catch(e){
      console.error('Failed to save data', e);
    }
  }

  function renderMain(){
    if(!nameEl) return;
    const data = loadData();
    // Apply default theme if present in data (admin-selected default)
    try{ if(window.UI && typeof window.UI.applyTheme === 'function' && data && data.defaultTheme){ window.UI.applyTheme(data.defaultTheme); window.UI.saveTheme && window.UI.saveTheme(data.defaultTheme); } }catch(e){}
  nameEl.textContent = data.name;
  headlineEl.textContent = data.headline;
    // Last update date/time
    const lastUpdateEl = document.getElementById('last-update');
    let lastUpdate = null;
    // Prefer Firestore meta doc's lastUpdate if present, else localStorage key
    if(data && typeof data.lastUpdate === 'number') lastUpdate = data.lastUpdate;
    if(!lastUpdate){
      try{
        const lu = localStorage.getItem('portfolio:lastUpdate');
        if(lu && !isNaN(Number(lu))) lastUpdate = Number(lu);
      }catch(e){}
    }
    if(lastUpdateEl){
      if(lastUpdate){
        const d = new Date(lastUpdate);
        // Format: Oct 14, 2025, 09:32 AM
        const opts = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        let formatted = d.toLocaleString('en-US', opts);
        // Remove seconds, add AM/PM
        formatted = formatted.replace(/:([0-9]{2})\s/, ' ');
        lastUpdateEl.textContent = `Last updated: ${formatted}`;
      }else{
        lastUpdateEl.textContent = '';
      }
    }
  // profile image and caption
  const profileImgEl = document.getElementById('profile-image');
  const profileImgLink = document.getElementById('profile-image-link');
  const profileCaptionEl = document.getElementById('profile-image-caption');
  if(profileImgEl && data.profile && data.profile.image){ profileImgEl.src = data.profile.image; if(profileImgLink) profileImgLink.href = data.profile.image; }
  if(profileCaptionEl && data.profile && data.profile.caption) profileCaptionEl.innerHTML = data.profile.caption;
  if(aboutEl) aboutEl.innerHTML = data.about || '';
    // Skills: technical and soft
    if(techSkillsListEl){
      techSkillsListEl.innerHTML = '';
      (data.skills && data.skills.technical || []).forEach(s=>{
        const li = document.createElement('li');
        li.innerHTML = `${s.name} ${s.link? '— <a href="'+s.link+'">View Certificate</a>':''}`;
        techSkillsListEl.appendChild(li);
      });
    }
    if(softSkillsListEl){
      softSkillsListEl.innerHTML = '';
      (data.skills && data.skills.soft || []).forEach(s=>{
        const li = document.createElement('li');
        li.textContent = s.name;
        softSkillsListEl.appendChild(li);
      });
    }

    // Wire skill buttons (if present) to show modal lists
    document.querySelectorAll('.skill-button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const type = btn.getAttribute('data-skill-type');
        openSkillsModal(type);
      });
    });

    // Ensure modal close handlers are wired on pages that include the skills modal (index.html)
    if(!skillsModalWired && skillsModal){
      const close = document.getElementById('skills-modal-close');
      const overlay = document.getElementById('skills-modal-overlay');
      if(close) close.addEventListener('click', ()=> skillsModal.setAttribute('aria-hidden','true'));
      if(overlay) overlay.addEventListener('click', ()=> skillsModal.setAttribute('aria-hidden','true'));
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') skillsModal.setAttribute('aria-hidden','true'); });
      skillsModalWired = true;
    }


  function openSkillsModal(type){
    const data = loadData();
    const list = type === 'soft' ? (data.skills && data.skills.soft || []) : (data.skills && data.skills.technical || []);
    if(!skillsModal || !skillsModalList) return;
    skillsModalList.innerHTML = '';
    list.forEach(s=>{
      const li = document.createElement('li');
      if(type === 'soft') li.textContent = s.name;
      else li.innerHTML = s.link ? `${s.name} — <a href="${s.link}">View</a>` : s.name;
      skillsModalList.appendChild(li);
    });
    skillsModal.setAttribute('aria-hidden','false');
  }
    // render projects as cards
    // ensure container exists
    if(!projectsListEl) projectsListEl = document.getElementById('projects-list') || document.querySelector('.projects-grid');
    if(!projectsListEl) return;
    projectsListEl.innerHTML = '';
    // render card helper
    const renderProjectCard = (title, desc, link, source) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = title;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        openProjectModal(title, desc, link, source);
      });
      h3.appendChild(a);
      // Note: live/visit button intentionally omitted from project listing; available in project modal only.
      card.appendChild(h3);
      projectsListEl.appendChild(card);
    };
    // Include portfolio as a project, but render internship separately
    // support legacy single 'internship' object by normalizing to internships array
    const internship = (data.internships && data.internships[0]) || data.internship || {};

    // Use a safe projects array and avoid duplicate internship-like entries
    const projectsArray = Array.isArray(data.projects) ? data.projects : (defaultData().projects || []);
    const projectsToRender = projectsArray.filter(p => {
      if(!p || !p.title) return false;
      const title = (p.title||'').toLowerCase();
      if(internship && internship.text){
        if(title.includes('intern')) return false;
      }
      return true;
    });
    projectsToRender.forEach(p => renderProjectCard(p.title, p.desc, p.link, p.source));
    if(internship.portfolioText) renderProjectCard('Portfolio', internship.portfolioText, '', '');

    // Render internships section (supports multiple internships)
    const internshipSection = document.getElementById('internship');
    if(internshipSection){
      const container = document.createElement('div');
      container.id = 'internship-list';
      const internships = data.internships || (data.internship ? [data.internship] : []);
      if(internships.length === 0){
        container.innerHTML = '<p id="internship-text">Internships provide industry exposure and hands-on experience.</p>';
      }else{
        internships.forEach(inst => {
          const block = document.createElement('div');
          block.className = 'intern-block';
          const h3 = document.createElement('h3');
          h3.textContent = inst.company || 'Internship';
          const role = document.createElement('div'); role.className = 'intern-role'; role.textContent = inst.role || '';
          const txt = document.createElement('div'); txt.innerHTML = inst.text || '';
          const plink = document.createElement('p');
          if(inst.link) plink.innerHTML = `Details: <a href="${inst.link}">${inst.link}</a>`;
          block.appendChild(h3); if(inst.role) block.appendChild(role); block.appendChild(txt); if(inst.link) block.appendChild(plink);
          container.appendChild(block);
        });
      }
      // replace existing content inside internship section
      const existing = document.getElementById('internship-content');
      if(existing) internshipSection.removeChild(existing);
      container.id = 'internship-content';
      internshipSection.appendChild(container);
    }

    // no legacy internshipContainer handling — internship is rendered into its own section

    // Resume
    if(resumeSection){
      const r = data.resume || '';
      const a = resumeSection.querySelector('a');
      if(a) a.href = r;
    }

    // Achievements
    const achievementsListEl = document.getElementById('achievements-list');
    if(achievementsListEl){
      achievementsListEl.innerHTML = '';
      (data.achievements||[]).forEach(item=>{
        const li = document.createElement('li');
        li.textContent = item;
        achievementsListEl.appendChild(li);
      });
    }

    // Contact
    if(contactSection){
      const c = data.contact || {};
      const ps = contactSection.querySelectorAll('p');
      if(ps[0]) ps[0].textContent = 'Email: ' + (c.email||'');
      if(ps[1]) ps[1].textContent = 'Phone: ' + (c.phone||'');
      if(ps[2]){
        const link = ps[2].querySelector('a');
        if(link) link.href = c.linkedin || '#';
      }
    }
  }

  // Project modal helpers
  function openProjectModal(title, desc, link, source){
    const modal = document.getElementById('project-modal');
    const body = document.getElementById('project-modal-body');
    const titleEl = document.getElementById('project-modal-title');
    const linkEl = document.getElementById('project-modal-link');
    if(!modal) return;
    titleEl.textContent = title;
    body.innerHTML = desc || '';
    // show Visit and/or Source buttons when links are provided
    linkEl.innerHTML = '';
    if(link){
      const visitBtn = document.createElement('a');
      visitBtn.className = 'btn primary';
      visitBtn.textContent = 'Visit';
      visitBtn.href = link;
      visitBtn.target = '_blank';
      visitBtn.rel = 'noopener noreferrer';
      linkEl.appendChild(visitBtn);
    }
    if(source){
      const srcBtn = document.createElement('a');
      srcBtn.className = 'btn';
      srcBtn.textContent = 'Source';
      srcBtn.href = source;
      srcBtn.target = '_blank';
      srcBtn.rel = 'noopener noreferrer';
      srcBtn.style.marginLeft = '8px';
      linkEl.appendChild(srcBtn);
    }
    modal.setAttribute('aria-hidden','false');
    // wire close
    const close = document.getElementById('project-modal-close');
    const overlay = document.getElementById('project-modal-overlay');
    if(close) close.addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
    if(overlay) overlay.addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') modal.setAttribute('aria-hidden','true'); });
  }

  function renderEditor(){
    if(!editorSection) return;
    const data = loadData();
  nameInput.value = data.name;
  headlineInput.value = data.headline;
  // reflect default theme in admin selector (if present)
  try{ if(adminThemeSelect && data && data.defaultTheme) adminThemeSelect.value = data.defaultTheme; }catch(e){}
  // about is stored as HTML for rich text
  if(aboutInput) aboutInput.innerHTML = data.about || '';
    projectsEditor.innerHTML = '';
    (data.projects||[]).forEach((p, idx) => {
      projectsEditor.appendChild(createProjectEditor(p, idx));
    });
    // skills editors: technical and soft
    if(techSkillsEditor){
      techSkillsEditor.innerHTML = '';
      (data.skills && data.skills.technical || []).forEach((s, idx)=>{
        techSkillsEditor.appendChild(createSkillEditor(s, idx));
      });
    }
    if(softSkillsEditor){
      softSkillsEditor.innerHTML = '';
      (data.skills && data.skills.soft || []).forEach((s, idx)=>{
        softSkillsEditor.appendChild(createSkillEditor(s, idx));
      });
    }
    // achievements editor
    const achievementsEditor = document.getElementById('achievements-editor');
    if(achievementsEditor){
      achievementsEditor.innerHTML = '';
      (data.achievements||[]).forEach((a, idx)=>{
        const node = createAchievementEditor(a, idx);
        achievementsEditor.appendChild(node);
      });
    }
  // populate internships editor (multiple)
  if(internshipsEditor){
    internshipsEditor.innerHTML = '';
    const list = data.internships || (data.internship ? [data.internship] : []);
    list.forEach((inst, idx) => internshipsEditor.appendChild(createInternshipEditor(inst, idx)));
  }
    resumeLinkInput.value = data.resume || '';
    contactEmail.value = (data.contact && data.contact.email) || '';
    contactPhone.value = (data.contact && data.contact.phone) || '';
    contactLinkedIn.value = (data.contact && data.contact.linkedin) || '';

    // If contact fields are empty, try to import previous values from index.html automatically
    if(!contactEmail.value && !contactPhone.value && !contactLinkedIn.value){
      (async ()=>{
        try{
          const resp = await fetch('index.html');
          if(!resp.ok) return;
          const text = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const ps = doc.querySelectorAll('#contact p');
          if(ps[0] && !contactEmail.value) contactEmail.value = ps[0].textContent.replace('Email:','').trim();
          if(ps[1] && !contactPhone.value) contactPhone.value = ps[1].textContent.replace('Phone:','').trim();
          if(ps[2] && !contactLinkedIn.value){
            const a = ps[2].querySelector('a');
            if(a) contactLinkedIn.value = a.href;
          }
        }catch(e){
          // fetch may fail on file:// or blocked origins; ignore silently
        }
      })();
    }
  // profile fields
  if(profileImageUrlInput) profileImageUrlInput.value = (data.profile && data.profile.image) || '';
  if(profileImageCaptionInput) profileImageCaptionInput.value = (data.profile && data.profile.caption) || '';
  if(profileImagePreview){ profileImagePreview.src = (data.profile && data.profile.image) || 'img/velan.jpg'; }
  }

  // wire profile image file input preview -> convert to data URL
  if(profileImageFileInput){
    profileImageFileInput.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        const dataUrl = reader.result;
        if(profileImagePreview) profileImagePreview.src = dataUrl;
        if(profileImageUrlInput) profileImageUrlInput.value = dataUrl;
        // After previewing, attempt to upload and persist the image immediately
        (async ()=>{
          try{
            // Prefer Firebase Storage upload when available & admin signed-in
            if(firebaseStorage && firebaseAuth && firebaseAuth.currentUser && typeof firebaseAuth.currentUser.email === 'string' && firebaseAuth.currentUser.email.toLowerCase() === (ADMIN_ALLOWED_EMAIL||'').toLowerCase()){
              // create a storage ref and upload
              const ext = (f.name || '').split('.').pop() || 'png';
              const path = `profile-images/${Date.now()}_${Math.random().toString(36).slice(2,9)}.${ext}`;
              try{
                const ref = firebaseStorage.ref().child(path);
                const snap = await ref.put(f);
                const url = await snap.ref.getDownloadURL();
                // update local data and meta (merge)
                try{
                  const current = loadData();
                  current.profile = current.profile || {};
                  current.profile.image = url;
                  saveData(current);
                  if(window.UI && window.UI.showToast) window.UI.showToast('Profile image uploaded');
                }catch(e){}
                try{ if(metaDocRef) metaDocRef.set({ profile: { image: url }, lastUpdate: Date.now() }, { merge: true }); }catch(e){}
                return;
              }catch(err){
                console.warn('Firebase upload failed, falling back to local data URL', err);
              }
            }
            // Fallback: store data URL locally so preview persists
            try{
              const current = loadData();
              current.profile = current.profile || {};
              current.profile.image = dataUrl;
              saveData(current);
              if(window.UI && window.UI.showToast) window.UI.showToast('Profile image saved locally. Sign in to upload to cloud.');
            }catch(e){}
          }catch(e){ console.warn('Profile auto-save failed', e); }
        })();
      };
      reader.readAsDataURL(f);
    });
  }

  function createInternshipEditor(inst, idx){
    const wrap = document.createElement('div');
    wrap.className = 'project-item internship-item';

    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.gap = '8px'; header.style.alignItems = 'center';
    const company = document.createElement('input'); company.placeholder = 'Company / Organization'; company.value = inst.company || '';
    const role = document.createElement('input'); role.placeholder = 'Role / Title'; role.value = inst.role || '';
    const remove = document.createElement('button'); remove.className = 'btn'; remove.textContent = 'Remove';
    header.appendChild(company); header.appendChild(role); header.appendChild(remove);

    const toolbar = document.createElement('div'); toolbar.className = 'editor-toolbar'; toolbar.setAttribute('data-target', `internship-rte-${idx}`);
    ['bold','italic','insertUnorderedList','createLink','removeFormat'].forEach(cmd=>{
      const b = document.createElement('button'); b.type='button'; b.className='btn'; b.setAttribute('data-cmd',cmd);
      b.textContent = cmd === 'insertUnorderedList' ? '• List' : (cmd === 'createLink' ? 'Link' : cmd === 'removeFormat' ? 'Clear' : cmd === 'bold' ? 'B' : 'I');
      b.addEventListener('click', ()=>{
        if(cmd === 'createLink'){ const url = prompt('Enter URL'); if(url) document.execCommand('createLink', false, url); return; }
        document.execCommand(cmd, false, null);
      });
      toolbar.appendChild(b);
    });

    const rte = document.createElement('div'); rte.className='rte'; rte.id = `internship-rte-${idx}`; rte.contentEditable = true; rte.innerHTML = inst.text || '';
    const linkInput = document.createElement('input'); linkInput.placeholder = 'Optional link (offer/letter/project)'; linkInput.value = inst.link || '';

    remove.addEventListener('click', ()=> wrap.remove());

    wrap.appendChild(header); wrap.appendChild(toolbar); wrap.appendChild(rte); wrap.appendChild(linkInput);
    return wrap;
  }

  function createProjectEditor(project, idx){
    const wrap = document.createElement('div');
    wrap.className = 'project-item';
    // store saved values on dataset
    wrap.dataset.title = project.title || '';
    wrap.dataset.desc = project.desc || '';

    // display row
    const display = document.createElement('div');
    display.className = 'project-display';
    const titleEl = document.createElement('strong');
    titleEl.textContent = wrap.dataset.title || 'Untitled Project';
    titleEl.style.display = 'block';
    const preview = document.createElement('div');
    preview.className = 'project-preview';
    preview.innerHTML = wrap.dataset.desc || '';
    const actions = document.createElement('div');
    actions.style.marginTop = '8px';
    const editBtn = document.createElement('button'); editBtn.className = 'btn'; editBtn.textContent = 'Edit';
    const removeBtn = document.createElement('button'); removeBtn.className = 'btn'; removeBtn.textContent = 'Remove';
    actions.appendChild(editBtn); actions.appendChild(removeBtn);
    display.appendChild(titleEl); display.appendChild(preview); display.appendChild(actions);

    // editor panel (hidden by default)
    const editor = document.createElement('div');
    editor.className = 'project-editor';
    editor.style.display = 'none';
  const titleInput = document.createElement('input'); titleInput.value = wrap.dataset.title; titleInput.placeholder = 'Project title';
  const linkInput = document.createElement('input'); linkInput.value = project.link || '';
  linkInput.placeholder = 'Optional live site URL (https://...)';
  // source (git) link input
  const sourceInput = document.createElement('input'); sourceInput.value = project.source || '';
  sourceInput.placeholder = 'Optional source (Git) URL (https://github.com/...)';
    // toolbar
    const toolbar = document.createElement('div'); toolbar.className = 'editor-toolbar';
    ['bold','italic','insertUnorderedList','createLink','removeFormat'].forEach(cmd=>{
      const b = document.createElement('button'); b.type='button'; b.className='btn'; b.setAttribute('data-cmd',cmd);
      b.textContent = cmd === 'insertUnorderedList' ? '• List' : (cmd === 'createLink' ? 'Link' : cmd === 'removeFormat' ? 'Clear' : cmd === 'bold' ? 'B' : 'I');
      b.addEventListener('click', ()=>{
        if(cmd === 'createLink'){
          const url = prompt('Enter URL'); if(url) document.execCommand('createLink', false, url); return;
        }
        document.execCommand(cmd, false, null);
      });
      toolbar.appendChild(b);
    });
    const descEditor = document.createElement('div'); descEditor.className='rte'; descEditor.contentEditable = true; descEditor.innerHTML = wrap.dataset.desc || '';
    const saveBtn = document.createElement('button'); saveBtn.className='btn primary'; saveBtn.textContent = 'Save';
    const cancelBtn = document.createElement('button'); cancelBtn.className='btn'; cancelBtn.textContent = 'Cancel';
  editor.appendChild(titleInput);
  // link input for optional live/demo site
  editor.appendChild(linkInput);
  editor.appendChild(sourceInput);
  editor.appendChild(toolbar); editor.appendChild(descEditor); editor.appendChild(saveBtn); editor.appendChild(cancelBtn);

    // wire actions
    editBtn.addEventListener('click', ()=>{
      // populate editor with current data
      titleInput.value = wrap.dataset.title || '';
      descEditor.innerHTML = wrap.dataset.desc || '';
      display.style.display = 'none'; editor.style.display = '';
    });
    cancelBtn.addEventListener('click', ()=>{
      editor.style.display = 'none'; display.style.display = '';
    });
    saveBtn.addEventListener('click', ()=>{
      const newTitle = titleInput.value.trim();
      const newDesc = descEditor.innerHTML.trim();
      const newLink = (linkInput.value || '').trim();
      const newSource = (sourceInput.value || '').trim();
      wrap.dataset.title = newTitle;
      wrap.dataset.desc = newDesc;
      wrap.dataset.link = newLink;
      wrap.dataset.source = newSource;
      titleEl.textContent = newTitle || 'Untitled Project';
      // update preview HTML then optionally append live link badge
      preview.innerHTML = newDesc || '';
      // remove existing live badge if present
      // remove existing badges (Visit/Source) if present
      preview.querySelectorAll('a').forEach(n=> n.remove());
      if(newLink){
        const liveBadge = document.createElement('a'); liveBadge.className = 'btn'; liveBadge.textContent = 'Visit'; liveBadge.href = newLink; liveBadge.target = '_blank'; liveBadge.style.marginLeft = '8px';
        preview.appendChild(liveBadge);
      }
      if(newSource){
        const srcBadge = document.createElement('a'); srcBadge.className = 'btn'; srcBadge.textContent = 'Source'; srcBadge.href = newSource; srcBadge.target = '_blank'; srcBadge.style.marginLeft = '8px';
        preview.appendChild(srcBadge);
      }
      editor.style.display = 'none'; display.style.display = '';
    });
    removeBtn.addEventListener('click', ()=> wrap.remove());

    // auto-open editor for empty projects
    if(!wrap.dataset.title){ display.style.display='none'; editor.style.display=''; }

    wrap.appendChild(display); wrap.appendChild(editor);
    return wrap;
  }

  function createSkillEditor(skill, idx){
    const wrap = document.createElement('div');
    wrap.className = 'project-item';
    const name = document.createElement('input');
    name.value = skill.name;
    name.placeholder = 'Skill name';
    const link = document.createElement('input');
    link.value = skill.link || '';
    link.placeholder = 'Certificate link (optional)';
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.className = 'btn';
    remove.addEventListener('click', () => wrap.remove());
    wrap.appendChild(name);
    wrap.appendChild(link);
    wrap.appendChild(remove);
    return wrap;
  }

  function createAchievementEditor(text, idx){
    const wrap = document.createElement('div');
    wrap.className = 'achievement-item';
    const input = document.createElement('input');
    input.value = text || '';
    input.placeholder = 'Achievement or certification';
    const remove = document.createElement('button'); remove.className = 'btn'; remove.textContent = 'Remove';
    remove.addEventListener('click', ()=> wrap.remove());
    wrap.appendChild(input);
    wrap.appendChild(remove);
    return wrap;
  }

  function getEditorData(){
    const projects = [];
    projectsEditor.querySelectorAll('.project-item').forEach(el => {
      // prefer saved dataset values; if editor currently open, read editor values
      const editorOpen = el.querySelector('.project-editor') && el.querySelector('.project-editor').style.display !== 'none';
      if(editorOpen){
        const title = el.querySelector('.project-editor input')?.value || '';
        const desc = el.querySelector('.project-editor .rte')?.innerHTML || '';
        const link = el.querySelector('.project-editor input[placeholder*="live"]')?.value || '';
        const source = el.querySelector('.project-editor input[placeholder*="Git"]')?.value || '';
        if(title || desc || link || source) projects.push({title, desc, link, source});
      }else{
        const title = el.dataset.title || '';
        const desc = el.dataset.desc || '';
        const link = el.dataset.link || '';
        const source = el.dataset.source || '';
        if(title || desc || link || source) projects.push({title, desc, link, source});
      }
    });
    const skills = [];
    // technical skills
    const tech = [];
    if(techSkillsEditor){
      techSkillsEditor.querySelectorAll('.project-item').forEach(el=>{
        const inputs = el.querySelectorAll('input');
        const name = inputs[0]?.value||'';
        const link = inputs[1]?.value||'';
        if(name) tech.push({name, link});
      });
    }
    // soft skills
    const soft = [];
    if(softSkillsEditor){
      softSkillsEditor.querySelectorAll('.project-item').forEach(el=>{
        const inputs = el.querySelectorAll('input');
        const name = inputs[0]?.value||'';
        if(name) soft.push({name});
      });
    }
    // achievements
    const achievements = [];
    const achievementsEditor = document.getElementById('achievements-editor');
    if(achievementsEditor){
      achievementsEditor.querySelectorAll('.achievement-item').forEach(el=>{
        const v = el.querySelector('input')?.value || '';
        if(v) achievements.push(v);
      });
    }
    // collect internships from editor
    const internships = [];
    if(internshipsEditor){
      internshipsEditor.querySelectorAll('.internship-item').forEach(el => {
        const inputs = el.querySelectorAll('input');
        const company = inputs[0]?.value?.trim() || '';
        const role = inputs[1]?.value?.trim() || '';
        const text = el.querySelector('.rte')?.innerHTML?.trim() || '';
        // optional third input for the link
        const link = inputs[2]?.value?.trim() || '';
        if(company || role || text || link) internships.push({company, role, text, link});
      });
    }
    const resume = (resumeLinkInput.value||'').trim();
    const contact = {email: (contactEmail.value||'').trim(), phone: (contactPhone.value||'').trim(), linkedin: (contactLinkedIn.value||'').trim()};
    const profile = { image: (profileImageUrlInput && profileImageUrlInput.value || '').trim(), caption: (profileImageCaptionInput && profileImageCaptionInput.value || '').trim() };
    // defaultTheme: selected theme in the admin editor (if present)
    const defaultTheme = (adminThemeSelect && adminThemeSelect.value) || '';
    return {
      name: nameInput.value.trim(),
      headline: headlineInput.value.trim(),
      about: (aboutInput && aboutInput.innerHTML) ? aboutInput.innerHTML.trim() : (aboutInput.value || '').trim(),
      defaultTheme,
      projects,
      skills: {technical: tech, soft},
      internships, resume, contact,
      profile,
      achievements
    };
  }

  // --- Firestore helper functions for collections-based storage ---
  async function clearAndWriteCollection(colRef, docs){
    if(!colRef) return;
    // delete existing docs in collection (batch) then write new ones
    try{
      const snap = await colRef.get();
      const batch = firestore.batch();
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }catch(e){
      // ignore if delete fails (permissions or not needed)
    }
    // write new docs in small batches
    try{
      const chunkSize = 400; // safe batch size lower than 500
      for(let i=0;i<docs.length;i+=chunkSize){
        const batch = firestore.batch();
        const slice = docs.slice(i, i+chunkSize);
        slice.forEach(doc => {
          const ref = colRef.doc();
          batch.set(ref, doc);
        });
        await batch.commit();
      }
    }catch(e){ console.error('Failed to write collection docs', e); }
  }

  async function writePortfolioCollections(data){
    if(!firestore) throw new Error('Firestore not initialized');
    // meta doc: name, headline, about, profile, resume, contact, lastUpdate
    const meta = {
      name: data.name||'', headline: data.headline||'', about: data.about||'', profile: data.profile||{}, resume: data.resume||'', contact: data.contact||{}, lastUpdate: Date.now(), defaultTheme: data.defaultTheme || ''
    };
    const promises = [];
    if(metaDocRef) promises.push(metaDocRef.set(meta));
    // projects -> array of {title, desc}
    if(projectsColRef) promises.push(clearAndWriteCollection(projectsColRef, (data.projects||[]).map((p, idx)=> Object.assign({}, p, { order: idx }))));
    // internships
    if(internshipsColRef) promises.push(clearAndWriteCollection(internshipsColRef, (data.internships||[]).map((i, idx)=> Object.assign({}, i, { order: idx }))));
    // achievements -> each doc {text, order}
    if(achievementsColRef) promises.push(clearAndWriteCollection(achievementsColRef, (data.achievements||[]).map((a, idx)=> ({ text: a, order: idx }))));
    // skills -> write two types: technical and soft; clear any existing skill docs and write new ones
    if(skillsColRef){
      const skillsToWrite = [];
      (data.skills && data.skills.technical || []).forEach((s, idx)=> skillsToWrite.push(Object.assign({}, s, { type: 'technical', order: idx })));
      (data.skills && data.skills.soft || []).forEach((s, idx)=> skillsToWrite.push(Object.assign({}, {name: s.name}, { type: 'soft', order: idx })));
      promises.push(clearAndWriteCollection(skillsColRef, skillsToWrite));
    }
    // Wait for all writes
    await Promise.all(promises);
  }

  // Subscribe to collections and meta doc and update localStorage + UI when anything changes
  function listenToPortfolioCollections(){
    if(!firestore) return;
    // meta doc
    try{
      if(metaDocRef && typeof metaDocRef.onSnapshot === 'function'){
        metaDocRef.onSnapshot(snap => {
          if(!snap.exists) return;
          const meta = snap.data();
          try{
            const current = loadData();
            const merged = Object.assign({}, current, { name: meta.name, headline: meta.headline, about: meta.about, profile: meta.profile, resume: meta.resume, contact: meta.contact, defaultTheme: meta.defaultTheme || '' });
            saveData(merged);
            renderMain(); renderEditor();
          }catch(e){ console.error('Failed to apply meta snapshot', e); }
        }, err => console.error('meta snapshot error', err));
      }
    }catch(e){ console.error('Failed to subscribe to metaDoc', e); }

    // projects collection
    try{
      if(projectsColRef && typeof projectsColRef.onSnapshot === 'function'){
        projectsColRef.onSnapshot(snap => {
          try{
            const projects = [];
            snap.forEach(d=> projects.push(d.data()));
            const current = loadData();
            current.projects = projects.sort((a,b)=> (a.order||0)-(b.order||0));
            saveData(current);
            renderMain(); renderEditor();
          }catch(e){ console.error('Failed to handle projects snapshot', e); }
        }, err => console.error('projects snapshot error', err));
      }
    }catch(e){ console.error('Failed to subscribe to projectsColRef', e); }

    // internships collection
    try{
      if(internshipsColRef && typeof internshipsColRef.onSnapshot === 'function'){
        internshipsColRef.onSnapshot(snap => {
          try{
            const list = [];
            snap.forEach(d=> list.push(d.data()));
            const current = loadData();
            current.internships = list.sort((a,b)=> (a.order||0)-(b.order||0));
            saveData(current);
            renderMain(); renderEditor();
          }catch(e){ console.error('Failed to handle internships snapshot', e); }
        }, err => console.error('internships snapshot error', err));
      }
    }catch(e){ console.error('Failed to subscribe to internshipsColRef', e); }

    // achievements
    try{
      if(achievementsColRef && typeof achievementsColRef.onSnapshot === 'function'){
        achievementsColRef.onSnapshot(snap => {
          try{
            const items = [];
            snap.forEach(d=> items.push(d.data()));
            const current = loadData();
            current.achievements = items.sort((a,b)=> (a.order||0)-(b.order||0)).map(x=> x.text || x);
            saveData(current);
            renderMain(); renderEditor();
          }catch(e){ console.error('Failed to handle achievements snapshot', e); }
        }, err => console.error('achievements snapshot error', err));
      }
    }catch(e){ console.error('Failed to subscribe to achievementsColRef', e); }

    // skills
    try{
      if(skillsColRef && typeof skillsColRef.onSnapshot === 'function'){
        skillsColRef.onSnapshot(snap => {
          try{
            const tech = []; const soft = [];
            snap.forEach(d=>{
              const v = d.data();
              if(v.type === 'soft') soft.push({name: v.name});
              else tech.push({name: v.name, link: v.link || ''});
            });
            const current = loadData();
            current.skills = { technical: tech.sort((a,b)=> (a.order||0)-(b.order||0)), soft: soft.sort((a,b)=> (a.order||0)-(b.order||0)) };
            saveData(current);
            renderMain(); renderEditor();
          }catch(e){ console.error('Failed to handle skills snapshot', e); }
        }, err => console.error('skills snapshot error', err));
      }
    }catch(e){ console.error('Failed to subscribe to skillsColRef', e); }
  }

  // Simple demo login -> just checks email matches DEMO_EMAIL
  function tryInitAdmin(){
    if(!loginBtn) return; // not on admin page
    loginBtn.addEventListener('click', () => {
      const email = (emailInput.value || '').trim().toLowerCase();
      if(email === DEMO_EMAIL){
        loginMsg.textContent = '';
        // hide login area and show signed-in banner
        const loginSection = document.querySelector('.login');
        if(loginSection) loginSection.classList.add('hidden');
        const banner = document.getElementById('signed-in-banner');
        const bannerEmail = document.getElementById('signed-in-email');
        if(banner && bannerEmail){ bannerEmail.textContent = DEMO_EMAIL; banner.classList.remove('hidden'); }
        editorSection.classList.remove('hidden');
        renderEditor();
      }else{
        loginMsg.textContent = 'Email not recognized. Use the demo email to unlock editing.';
        loginMsg.classList.add('muted');
      }
    });

    // Initialize Google Sign-In if GIS is available and google-config.json provides a client id.
    try{
      // fetch client id from server-served file
      (async ()=>{
        try{
          const cfgResp = await fetch('/google-config.json');
          if(!cfgResp.ok) throw new Error('Could not load google-config');
          const cfg = await cfgResp.json();
          GOOGLE_CLIENT_ID = cfg.GOOGLE_CLIENT_ID;
          // populate debug panel (if present) so deployed site can show the effective config
          // debug-info intentionally left blank for privacy; do not print origin or client id here
          // Only initialize GIS if library is present and the placeholder container exists
          const gisContainer = document.getElementById('g_id_signin');
          if(window.google && typeof window.google.accounts !== 'undefined' && gisContainer && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.indexOf('REPLACE_WITH') === -1){
            // choose verification endpoint based on environment:
            // - local dev server exposes /auth/google
            // - Vercel/serverless deployment exposes /api/auth/google
            const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            const VERIFY_URL = isLocal ? '/auth/google' : '/api/auth/google';

            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: async (resp) => {
                // resp.credential is an ID token (JWT). Send to server for verification.
                try{
                  const token = resp.credential;
                  const verifyResp = await fetch(VERIFY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_token: token })
                  });
                  try{ const dbg = document.getElementById('debug-info'); if(dbg){ dbg.textContent += ` verifyUrl=${VERIFY_URL}`; } }catch(e){}
                  if(!verifyResp.ok) {
                    const body = await verifyResp.json().catch(()=>({}));
                    loginMsg.textContent = 'Google sign-in failed: ' + (body.error || verifyResp.statusText);
                    return;
                  }
                  const body = await verifyResp.json();
                  const email = body.email;
                  // mark as signed in and show editor. Optionally, you can restrict to a single email.
                  emailInput.value = email;
                  // hide login area and show signed-in banner
                  const loginSection = document.querySelector('.login');
                  if(loginSection) loginSection.classList.add('hidden');
                  const banner = document.getElementById('signed-in-banner');
                  const bannerEmail = document.getElementById('signed-in-email');
                  if(banner && bannerEmail){ bannerEmail.textContent = email; banner.classList.remove('hidden'); }
                  editorSection.classList.remove('hidden');
                  renderEditor();
                  // If Firebase Auth is available, sign in client-side so onAuthStateChanged is populated
                  try{
                    if(firebaseAuth && token){
                      const credential = firebase.auth.GoogleAuthProvider.credential(token);
                      firebaseAuth.signInWithCredential(credential).catch(err=> console.warn('FirebaseAuth signInWithCredential failed', err));
                    }
                  }catch(e){ /* ignore */ }
                }catch(err){
                  console.error('Failed to verify ID token with server', err);
                  loginMsg.textContent = 'Sign-in failed (server verification error)';
                }
              }
            });
            window.google.accounts.id.renderButton(gisContainer, { theme: 'outline', size: 'large' });
            // optionally, you can call prompt() to show credential chooser
            // window.google.accounts.id.prompt();
          }else{
            // GIS not available or client id missing -> keep login area visible without demo fallback
          }
        }catch(err){
          // could not load config or GIS not available; keep demo disabled so only configured GIS will work
        }
      })();
    }catch(e){
      // ignore errors - keep fallback
    }

    // back button on the login area: go back to the public site
    const backBtn = document.getElementById('back-btn');
    if(backBtn){
      backBtn.addEventListener('click', ()=>{
        // prefer history back if possible, otherwise go to index.html
        if(window.history && window.history.length > 1) window.history.back();
        else window.location.href = 'index.html';
      });
    }

    // Firebase sign-in / sign-out buttons (if present)
    const fbSignInBtn = document.getElementById('firebase-signin-btn');
    const fbSignOutBtn = document.getElementById('firebase-signout-btn');
    if(fbSignInBtn && firebaseAuth){
      fbSignInBtn.addEventListener('click', async ()=>{
        try{
          const provider = new firebase.auth.GoogleAuthProvider();
          await firebaseAuth.signInWithPopup(provider);
        }catch(e){ console.error('Firebase signInWithPopup failed', e); alert('Sign-in failed'); }
      });
    }
    if(fbSignOutBtn && firebaseAuth){
      fbSignOutBtn.addEventListener('click', async ()=>{
        try{ await firebaseAuth.signOut(); }catch(e){ console.error(e); }
      });
    }

    addProjectBtn.addEventListener('click', () => {
      projectsEditor.appendChild(createProjectEditor({title:'',desc:''}));
    });

    if(addTechSkillBtn){
      addTechSkillBtn.addEventListener('click', ()=>{
        techSkillsEditor.appendChild(createSkillEditor({name:'',link:''}));
      });
    }
      if(addSoftSkillBtn){
        addSoftSkillBtn.addEventListener('click', ()=>{
          softSkillsEditor.appendChild(createSkillEditor({name:'',link:''}));
        });
      }
      if(addInternshipBtn){
        addInternshipBtn.addEventListener('click', ()=>{
          if(internshipsEditor) internshipsEditor.appendChild(createInternshipEditor({company:'',role:'',text:'',link:''}, Date.now()));
        });
      }
    // achievements add
    const addAchievementBtn = document.getElementById('add-achievement');
    if(addAchievementBtn){
      addAchievementBtn.addEventListener('click', ()=>{
        const ed = document.getElementById('achievements-editor');
        if(ed) ed.appendChild(createAchievementEditor(''));
      });
    }

    importBtn.addEventListener('click', async ()=>{
      // Attempt to fetch index.html and parse known sections
      try{
        const resp = await fetch('index.html');
        if(!resp.ok) throw new Error('fetch failed');
        const text = await resp.text();
        // create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        // pull values
        const name = doc.getElementById('name')?.textContent || '';
        const headline = doc.getElementById('headline')?.textContent || '';
          const about = doc.getElementById('about-text')?.innerHTML || doc.getElementById('about-text')?.textContent || '';
        const skills = {technical: [], soft: []};
        doc.querySelectorAll('#tech-skills-list li').forEach(li=>{
          const a = li.querySelector('a');
          const name = li.childNodes[0]?.textContent?.trim() || '';
          skills.technical.push({name: name.replace('—','').trim(), link: a? a.getAttribute('href'): ''});
        });
        doc.querySelectorAll('#soft-skills-list li').forEach(li=>{
          const name = li.textContent?.trim() || '';
          skills.soft.push({name});
        });
        const projects = [];
      // support both list items and project-card structures
        doc.querySelectorAll('#projects-list li, #projects-list .project-card').forEach(node=>{
          const title = node.querySelector('h3') ? node.querySelector('h3').textContent : (node.textContent.split('—')[0]||'').trim();
          const desc = node.querySelector('p') ? node.querySelector('p').innerHTML : (node.textContent.split('—')[1]||'').trim();
          projects.push({title, desc});
        });
        // Try to import internship company/title from nearby headings or content
        const internship = {
          company: doc.querySelector('#internship h3')?.textContent?.trim() || doc.querySelector('#internship-content h3')?.textContent?.trim() || '',
          role: doc.querySelector('#internship .role')?.textContent?.trim() || '',
          text: doc.querySelector('#internship-text')?.innerHTML || doc.querySelector('#internship-text')?.textContent || '',
          link: doc.querySelector('#internship-link a')?.getAttribute('href') || ''
        };
  const achievements = [];
  doc.querySelectorAll('#achievements-list li').forEach(li=> achievements.push(li.textContent.trim()));
        const resume = doc.querySelector('#resume a')?.getAttribute('href') || '';
        const contact = {email: doc.querySelector('#contact p')?.textContent.replace('Email:','').trim() || '', phone: (doc.querySelectorAll('#contact p')[1]?.textContent.replace('Phone:','').trim()) || '', linkedin: doc.querySelector('#contact a')?.getAttribute('href') || ''};

        // populate editor fields
        nameInput.value = name;
        headlineInput.value = headline;
        aboutInput.value = about;
        projectsEditor.innerHTML = '';
        projects.forEach(p=> projectsEditor.appendChild(createProjectEditor(p)));
  // populate technical + soft skill editors
  if(techSkillsEditor){ techSkillsEditor.innerHTML = ''; skills.technical.forEach(s=> techSkillsEditor.appendChild(createSkillEditor(s))); }
  if(softSkillsEditor){ softSkillsEditor.innerHTML = ''; skills.soft.forEach(s=> softSkillsEditor.appendChild(createSkillEditor(s))); }
  // populate achievements editor
  if(achievementsEditor){ achievementsEditor.innerHTML = ''; achievements.forEach(a=> achievementsEditor.appendChild(createAchievementEditor(a))); }
  // populate internships editor (imported)
  if(internshipsEditor){ internshipsEditor.innerHTML = ''; internshipsEditor.appendChild(createInternshipEditor(internship, 0)); }
        resumeLinkInput.value = resume || '';
        contactEmail.value = contact.email || '';
        contactPhone.value = contact.phone || '';
        contactLinkedIn.value = contact.linkedin || '';
        alert('Imported values from site. Review and click Save.');
      }catch(e){
        // fallback - ask user to paste about/skills manually
        const paste = prompt('Could not fetch index.html (file:// may block fetch). Paste the About text or press Cancel to skip.');
        if(paste) aboutInput.value = paste;
      }
    });

    // Apply resume default data (overwrite localStorage with parsed resume defaults)
    const applyResumeBtn = document.getElementById('apply-resume-btn');
    if(applyResumeBtn){
      applyResumeBtn.addEventListener('click', ()=>{
        if(!confirm('This will overwrite your local edits with the resume data. Continue?')) return;
        const data = defaultData();
        saveData(data);
        // refresh editor fields to reflect applied data
        renderEditor();
        // inform user
        alert('Resume data applied. Click Save if you want to keep changes (Save writes again to localStorage).');
      });
    }

    saveBtn.addEventListener('click', () => {
      // Prevent multi-clicks
      try{ saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }catch(e){}
      const data = getEditorData();
      // If any internship text is provided, avoid saving projects that look like internship entries
      if(data.internships && data.internships.some(i => i.text && i.text.trim())){
        data.projects = (data.projects||[]).filter(p => !(p.title||'').toLowerCase().includes('intern'));
      }
      // write locally first
      saveData(data);

      // async save flow: require auth (if available), upload profile image, then write collections
      (async ()=>{
        try{
          // If firebaseAuth exists, ensure an allowed admin is signed in
          if(firebaseAuth){
            const user = firebaseAuth.currentUser;
            if(!user){
              alert('Please sign in with the admin account to save changes.');
              saveBtn.disabled = false; saveBtn.textContent = 'Save';
              return;
            }
            const email = (user.email || '').toLowerCase();
            if(email !== (ADMIN_ALLOWED_EMAIL || '').toLowerCase()){
              alert('Signed-in account is not authorized to write. Use the configured admin account.');
              saveBtn.disabled = false; saveBtn.textContent = 'Save';
              return;
            }
          }

          // Handle profile image before writing meta:
          try{
            // 1) If a file input is selected, upload it (existing behavior)
            if(firebaseStorage){
              const uploadedUrl = await uploadProfileImageIfNeeded(data);
              if(uploadedUrl){ data.profile = data.profile || {}; data.profile.image = uploadedUrl; }
            }

            // 2) If profile.image is still a data URL (base64) we should either upload it to Storage
            //    or compress it. Writing raw large base64 strings into Firestore will fail or hang.
            const imgVal = data.profile && data.profile.image;
            if(imgVal && typeof imgVal === 'string' && imgVal.indexOf('data:') === 0){
              // If storage available, upload the data URL as a blob
              if(firebaseStorage){
                try{
                  // attempt to infer extension from data URL
                  const m = imgVal.match(/^data:image\/(png|jpeg|jpg|webp|gif)/i);
                  const ext = m ? (m[1].toLowerCase().replace('jpeg','jpg')) : 'png';
                  const uploaded = await uploadDataUrlToStorage(imgVal, ext);
                  if(uploaded){ data.profile.image = uploaded; }
                }catch(e){ console.warn('uploadDataUrlToStorage failed', e); }
              }else{
                // No storage: compress only if the data URL is large; otherwise keep it
                try{
                  const MAX_LOCAL_SAVE = 200 * 1024; // 200 KB
                  if(imgVal.length > MAX_LOCAL_SAVE){
                    const compressed = await compressDataUrl(imgVal, 1024, 0.7);
                    data.profile.image = compressed;
                  }
                }catch(e){ console.warn('compressDataUrl failed', e); }
              }

              // If after attempts the data URL is still excessively large, remove it from meta to avoid Firestore issues
              try{
                const finalVal = data.profile && data.profile.image;
                const TOO_LARGE = 800 * 1024; // 800 KB safe threshold for document payload
                if(finalVal && finalVal.length && finalVal.length > TOO_LARGE){
                  // keep local copy only and instruct user to sign-in to upload
                  const currentLocal = loadData();
                  currentLocal.profile = currentLocal.profile || {};
                  currentLocal.profile.image = finalVal; // keep locally
                  saveData(currentLocal);
                  // remove from data that will be written to Firestore/meta
                  data.profile.image = '';
                  alert('Profile image is too large to save to cloud. Sign in to upload or choose a smaller image.');
                }
              }catch(e){ console.warn('Final profile image size check failed', e); }
            }
          }catch(e){ console.warn('Profile upload/processing failed, continuing with existing image', e); }

          // write to Firestore (collections-based) if available
          try{
            if(firestore && metaDocRef){
              await writePortfolioCollections(data);
            }
          }catch(err){ console.error('Failed to write collections to Firestore', err); }

          // also write a lightweight 'lastUpdate' key so other tabs/windows receive a storage event
          try{ localStorage.setItem('portfolio:lastUpdate', String(Date.now())); }catch(e){}

          // Redirect immediately so admin sees the public page. Do not force sign-out here.
          window.location.href = 'index.html';
        }catch(err){
          console.error('Save flow error', err);
          alert('Save failed. See console for details.');
          try{ saveBtn.disabled = false; saveBtn.textContent = 'Save'; }catch(e){}
        }
      })();
    });

    logoutBtn.addEventListener('click', () => {
      (async ()=>{
        try{
          // If using Firebase Auth, sign out the user to clear session
          if(firebaseAuth){
            await firebaseAuth.signOut();
          }
        }catch(e){ console.warn('Sign-out failed', e); }
        // hide editor and show login area
        editorSection.classList.add('hidden');
        const loginSection = document.querySelector('.login');
        if(loginSection) loginSection.classList.remove('hidden');
        const banner = document.getElementById('signed-in-banner');
        if(banner) banner.classList.add('hidden');
        // adjust Firebase sign-in/out buttons if present
        const fbSignInBtn = document.getElementById('firebase-signin-btn');
        const fbSignOutBtn = document.getElementById('firebase-signout-btn');
        if(fbSignInBtn) fbSignInBtn.style.display = '';
        if(fbSignOutBtn) fbSignOutBtn.style.display = 'none';
        loginMsg.textContent = 'Logged out. Sign in to edit again.';
      })();
    });

    // Fullscreen support removed (button no longer present in admin.html)

    // Wire simple RTE toolbars
    document.querySelectorAll('.editor-toolbar').forEach(toolbar=>{
      const targetId = toolbar.getAttribute('data-target');
      const target = document.getElementById(targetId);
      toolbar.querySelectorAll('button[data-cmd]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const cmd = btn.getAttribute('data-cmd');
          if(cmd === 'createLink'){
            const url = prompt('Enter URL');
            if(url) document.execCommand('createLink', false, url);
            return;
          }
          document.execCommand(cmd, false, null);
        });
      });
      // focus target when clicked inside toolbar space
      toolbar.addEventListener('click', ()=> target && target.focus());
    });

    // Modal close handlers
    if(skillsModalClose) skillsModalClose.addEventListener('click', ()=> skillsModal && skillsModal.setAttribute('aria-hidden','true'));
    if(skillsModalOverlay) skillsModalOverlay.addEventListener('click', ()=> skillsModal && skillsModal.setAttribute('aria-hidden','true'));
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && skillsModal) skillsModal.setAttribute('aria-hidden','true');
    });
  }

  // Initialize
    // If firebaseAuth is available, wire UI to auth state
    try{
      if(firebaseAuth && typeof firebaseAuth.onAuthStateChanged === 'function'){
        firebaseAuth.onAuthStateChanged((user)=>{
          const fbSignInBtn = document.getElementById('firebase-signin-btn');
          const fbSignOutBtn = document.getElementById('firebase-signout-btn');
          if(user && user.email && user.email.toLowerCase() === (ADMIN_ALLOWED_EMAIL||'').toLowerCase()){
            // authorized admin
            const loginSection = document.querySelector('.login'); if(loginSection) loginSection.classList.add('hidden');
            const banner = document.getElementById('signed-in-banner'); const bannerEmail = document.getElementById('signed-in-email'); if(banner && bannerEmail){ bannerEmail.textContent = user.email; banner.classList.remove('hidden'); }
            editorSection.classList.remove('hidden');
            if(fbSignInBtn) fbSignInBtn.style.display = 'none';
            if(fbSignOutBtn) fbSignOutBtn.style.display = '';
            renderEditor();
          }else{
            // not signed-in or unauthorized
            const loginSection = document.querySelector('.login'); if(loginSection) loginSection.classList.remove('hidden');
            const banner = document.getElementById('signed-in-banner'); if(banner) banner.classList.add('hidden');
            editorSection.classList.add('hidden');
            if(fbSignInBtn) fbSignInBtn.style.display = '';
            if(fbSignOutBtn) fbSignOutBtn.style.display = 'none';
          }
        });
      }
    }catch(e){ /* ignore */ }
  try{
    // If Firestore is available, attempt initial load from collections/meta, migrate legacy single-doc if present, then subscribe to realtime updates.
    if(firestore){
      (async ()=>{
        try{
          // If legacy doc exists, migrate into new collections (one-time)
          if(legacyDocRef && typeof legacyDocRef.get === 'function'){
            try{
              const snap = await legacyDocRef.get();
              if(snap && snap.exists){
                const legacy = snap.data();
                // migrate legacy structure into collections/meta
                const migrated = Object.assign({}, legacy);
                // write collections using helper
                await writePortfolioCollections(migrated);
                // optionally delete legacy doc? keep for now
              }
            }catch(e){ /* ignore migration errors */ }
          }

          // Attempt to read meta doc first to seed localStorage
          if(metaDocRef && typeof metaDocRef.get === 'function'){
            try{
              const metaSnap = await metaDocRef.get();
              if(metaSnap && metaSnap.exists){
                const m = metaSnap.data();
                const current = loadData();
                const merged = Object.assign({}, current, { name: m.name, headline: m.headline, about: m.about, profile: m.profile, resume: m.resume, contact: m.contact, defaultTheme: m.defaultTheme || '' });
                saveData(merged);
              }
            }catch(e){ /* ignore read error */ }
          }

          // Try to read collections once to seed projects/internships/skills/achievements
          try{
            const [pSnap, iSnap, sSnap, aSnap] = await Promise.all([
              projectsColRef ? projectsColRef.get().catch(()=>null) : Promise.resolve(null),
              internshipsColRef ? internshipsColRef.get().catch(()=>null) : Promise.resolve(null),
              skillsColRef ? skillsColRef.get().catch(()=>null) : Promise.resolve(null),
              achievementsColRef ? achievementsColRef.get().catch(()=>null) : Promise.resolve(null)
            ]);
            const current = loadData();
            if(pSnap){ const projects = []; pSnap.forEach(d=> projects.push(d.data())); current.projects = projects.sort((a,b)=> (a.order||0)-(b.order||0)); }
            if(iSnap){ const list = []; iSnap.forEach(d=> list.push(d.data())); current.internships = list.sort((a,b)=> (a.order||0)-(b.order||0)); }
            if(sSnap){ const tech=[]; const soft=[]; sSnap.forEach(d=>{ const v=d.data(); if(v.type==='soft') soft.push({name:v.name, order:v.order}); else tech.push({name:v.name, link:v.link||'', order:v.order}); }); current.skills = { technical: tech.sort((a,b)=> (a.order||0)-(b.order||0)), soft: soft.sort((a,b)=> (a.order||0)-(b.order||0)) }; }
            if(aSnap){ const items=[]; aSnap.forEach(d=> items.push(d.data())); current.achievements = items.sort((a,b)=> (a.order||0)-(b.order||0)).map(x=> x.text || x); }
            saveData(current);
          }catch(e){ /* ignore seeding errors */ }

          // render UI now
          try{ renderMain(); }catch(e){}
          try{ renderEditor(); }catch(e){}

          // subscribe to realtime collection updates
          listenToPortfolioCollections();
          // Ensure admin UI wiring (sign-in buttons, handlers) runs regardless of Firestore availability
          tryInitAdmin();
        }catch(e){
          console.warn('Firestore initial load failed, falling back to localStorage', e);
          try{ renderMain(); }catch(e){}
          tryInitAdmin();
        }
      })();
    
    }else{
      // No Firestore - render using localStorage
      renderMain();
      tryInitAdmin();
    }

    // If another tab updates storage, re-render to pick up changes instantly
    window.addEventListener('storage', (e)=>{
      if(!e) return;
      if(e.key && (e.key.startsWith('portfolio:data') || e.key === 'portfolio:lastUpdate')){
        try{ renderMain(); }catch(err){}
      }
    });
  }catch(e){
    console.error(e);
  }
  // Wire resume link to open downloaded PDF in a new tab after fetch completes.
  try{
    document.addEventListener('DOMContentLoaded', ()=>{
      const resumeSection = document.getElementById('resume');
      if(!resumeSection) return;
      const link = resumeSection.querySelector('a');
      if(!link) return;
      // Enhance click: fetch the file and open in new tab (so browser shows the PDF) then also allow default download behavior
      link.addEventListener('click', async (ev)=>{
        try{
          // Only intercept if href is present
          const href = link.getAttribute('href');
          if(!href) return;
          // Prevent default to avoid immediate download
          ev.preventDefault();
          // Fetch the PDF as blob and open in new tab
          const resp = await fetch(href);
          if(!resp.ok) throw new Error('Failed to fetch resume');
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          // Open in new tab/window so user can view immediately
          const win = window.open(blobUrl, '_blank');
          if(!win) {
            // Popup blocked, fallback to navigate to blob URL in same tab
            window.location.href = blobUrl;
          }
          // Additionally create an invisible anchor to trigger a download with original filename
          try{
            const a = document.createElement('a');
            a.href = blobUrl;
            // preserve original filename if present in href
            const fn = href.split('/').pop() || 'resume.pdf';
            a.download = fn;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }catch(err){}
          // Revoke the blob URL after a short timeout to allow the viewer to load
          setTimeout(()=> URL.revokeObjectURL(blobUrl), 60 * 1000);
        }catch(err){
          // On error, allow the default anchor behavior (download or open depending on browser)
          console.warn('Resume open failed, falling back to default link behavior', err);
          // Let the link follow-through
          // For safety, use location.assign rather than link.click() to preserve href semantics
          window.location.assign(link.href);
        }
      });
    });
  }catch(e){ console.warn('Resume opener wiring failed', e); }
})();
