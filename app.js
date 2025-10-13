// Simple client-side portfolio editor with demo email check and localStorage persistence
(() => {
  const DEMO_EMAIL = 'velanm.cse2024@citchennai.net';
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
  let portfolioDocRef = null;
  try{
    if(window.firebase && typeof window.firebase.initializeApp === 'function'){
      try{ firebase.initializeApp(FIREBASE_CONFIG); }catch(e){}
      try{ firestore = firebase.firestore(); portfolioDocRef = firestore.collection('portfolio').doc('data-v1'); }catch(e){ console.warn('Firestore init failed', e); }
    }
  }catch(e){ console.warn('Firebase not available', e); }

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
  nameEl.textContent = data.name;
  headlineEl.textContent = data.headline;
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
    projectsListEl.innerHTML = '';
    // Render as compact title-only cards. Clicking title opens a modal with full details.
    const renderProjectCard = (title, desc, link) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = title;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        openProjectModal(title, desc, link);
      });
      h3.appendChild(a);
      card.appendChild(h3);
      projectsListEl.appendChild(card);
    };
    // Include portfolio as a project, but render internship separately
  // support legacy single 'internship' object by normalizing to internships array
  const internship = (data.internships && data.internships[0]) || data.internship || {};

    // Avoid duplicate internship entries: if an internship section exists, skip projects whose
    // title mentions 'intern' to prevent duplicates.
    const projectsToRender = (data.projects||[]).filter(p => {
      if(!p || !p.title) return false;
      const title = (p.title||'').toLowerCase();
      if(internship && internship.text){
        if(title.includes('intern')) return false;
      }
      return true;
    });
    projectsToRender.forEach(p => renderProjectCard(p.title, p.desc));
    if(internship.portfolioText) renderProjectCard('Portfolio', internship.portfolioText);

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
  function openProjectModal(title, desc, link){
    const modal = document.getElementById('project-modal');
    const body = document.getElementById('project-modal-body');
    const titleEl = document.getElementById('project-modal-title');
    const linkEl = document.getElementById('project-modal-link');
    if(!modal) return;
    titleEl.textContent = title;
    body.innerHTML = desc || '';
    if(link){
      linkEl.innerHTML = `<a href="${link}" target="_blank">Open Project Link</a>`;
    }else{
      linkEl.innerHTML = '';
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
    editor.appendChild(titleInput); editor.appendChild(toolbar); editor.appendChild(descEditor); editor.appendChild(saveBtn); editor.appendChild(cancelBtn);

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
      wrap.dataset.title = newTitle;
      wrap.dataset.desc = newDesc;
      titleEl.textContent = newTitle || 'Untitled Project';
      preview.innerHTML = newDesc || '';
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
        if(title || desc) projects.push({title, desc});
      }else{
        const title = el.dataset.title || '';
        const desc = el.dataset.desc || '';
        if(title || desc) projects.push({title, desc});
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
    return {
      name: nameInput.value.trim(),
      headline: headlineInput.value.trim(),
      about: (aboutInput && aboutInput.innerHTML) ? aboutInput.innerHTML.trim() : (aboutInput.value || '').trim(),
      projects,
      skills: {technical: tech, soft},
      internships, resume, contact,
      profile,
      achievements
    };
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
          if(window.google && typeof window.google.accounts !== 'undefined' && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.indexOf('REPLACE_WITH') === -1){
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
                }catch(err){
                  console.error('Failed to verify ID token with server', err);
                  loginMsg.textContent = 'Sign-in failed (server verification error)';
                }
              }
            });
            window.google.accounts.id.renderButton(document.getElementById('g_id_signin'), { theme: 'outline', size: 'large' });
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
      const data = getEditorData();
      // If any internship text is provided, avoid saving projects that look like internship entries
      if(data.internships && data.internships.some(i => i.text && i.text.trim())){
        data.projects = (data.projects||[]).filter(p => !(p.title||'').toLowerCase().includes('intern'));
      }
      // write locally first
      saveData(data);
      // also write to Firestore (if available) so other clients see updates immediately
      try{
        if(portfolioDocRef){
          const toWrite = Object.assign({}, data, { lastUpdate: Date.now() });
          portfolioDocRef.set(toWrite).catch(err=> console.error('Failed to write to Firestore', err));
        }
      }catch(err){ console.error('Firestore write error', err); }
      // also write a lightweight 'lastUpdate' key so other tabs/windows receive a storage event
      try{ localStorage.setItem('portfolio:lastUpdate', String(Date.now())); }catch(e){}
      // redirect to the public page so user can see changes immediately
      window.location.href = 'index.html';
    });

    logoutBtn.addEventListener('click', () => {
      editorSection.classList.add('hidden');
      // restore login area and hide banner
      const loginSection = document.querySelector('.login');
      if(loginSection) loginSection.classList.remove('hidden');
      const banner = document.getElementById('signed-in-banner');
      if(banner) banner.classList.add('hidden');
      loginMsg.textContent = 'Logged out. Sign in to edit again.';
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
  try{
    // If Firestore is available, attempt initial load from Firestore, then subscribe to realtime updates.
    if(portfolioDocRef && typeof portfolioDocRef.get === 'function'){
      portfolioDocRef.get().then(snap => {
        try{
          if(snap && snap.exists){
            const d = snap.data();
            if(d){
              try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }catch(e){}
            }
          }
        }catch(e){ console.error('Error reading initial Firestore doc', e); }
        // render using whichever source is now available (Firestore-backed localStorage or defaults)
        try{ renderMain(); }catch(e){}
        // also render editor if admin
        try{ renderEditor(); }catch(e){}
      }).catch(err => {
        console.warn('Initial Firestore get failed, falling back to localStorage', err);
        try{ renderMain(); }catch(e){}
      }).finally(()=>{
        // subscribe to realtime updates
        try{
          if(portfolioDocRef && typeof portfolioDocRef.onSnapshot === 'function'){
            portfolioDocRef.onSnapshot((snap)=>{
              try{
                if(!snap.exists) return;
                const d = snap.data();
                if(!d) return;
                try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }catch(e){}
                try{ renderMain(); renderEditor(); }catch(e){}
              }catch(e){ console.error('Error handling Firestore snapshot', e); }
            }, (err)=>{ console.error('Firestore snapshot error', err); });
          }
        }catch(e){ console.error('Failed to subscribe to Firestore snapshots', e); }
      });
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
})();
