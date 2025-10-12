// Lightweight UI helpers: button ripple, modal keyboard handling, smooth focus
(function(){
  // ripple effect for buttons
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.btn');
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(ripple);
    setTimeout(()=> ripple.remove(), 600);
  }, {passive:true});

  // Close modals on Escape
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(modal => modal.setAttribute('aria-hidden','true'));
  });

  // Hook overlay clicks to close
  document.addEventListener('click', function(e){
    const overlay = e.target.closest('.modal-overlay');
    if(!overlay) return;
    const modal = overlay.closest('.modal');
    if(modal) modal.setAttribute('aria-hidden','true');
  }, {passive:true});

  // Prevent body scroll when any modal is open
  const modalObserver = new MutationObserver(()=>{
    const anyOpen = !!document.querySelector('.modal[aria-hidden="false"]');
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  });
  modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['aria-hidden'] });

  // Scroll reveal using IntersectionObserver
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, {threshold: 0.12});
  document.querySelectorAll('.reveal, .project-card, section').forEach(el => revealObserver.observe(el));

  // Project card tilt effect
  function addTilt(card){
    card.addEventListener('mousemove', (e)=>{
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (-y) * 6; const ry = x * 6;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.classList.add('tilt');
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; card.classList.remove('tilt'); });
  }
  document.querySelectorAll('.project-card').forEach(addTilt);

  // Project search/filter
  const searchInput = document.getElementById('project-search-input');
  if(searchInput){
    searchInput.addEventListener('input', ()=>{
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll('#projects-list .project-card').forEach(card =>{
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent?.toLowerCase() || '';
        const ok = !q || title.includes(q) || desc.includes(q);
        card.style.display = ok ? '' : 'none';
      });
    });
  }

  // Simple animated counters for numeric stats (data-target attribute)
  function animateCounter(el){
    const target = parseInt(el.dataset.target || '0',10);
    if(!target) return;
    let current = 0; const step = Math.max(1, Math.floor(target / 60));
    const id = setInterval(()=>{
      current += step; if(current >= target){ current = target; clearInterval(id); }
      el.textContent = current.toString();
    }, 16);
  }
  document.querySelectorAll('.stat[data-target]').forEach(el=>{
    const io = new IntersectionObserver((entries, obs)=>{
      if(entries[0].isIntersecting){ animateCounter(el); obs.disconnect(); }
    }, {threshold:0.3});
    io.observe(el);
  });

  // Lazy-load images (data-src)
  const imgObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const img = entry.target;
      const src = img.getAttribute('data-src');
      if(src){ img.src = src; img.removeAttribute('data-src'); }
      imgObserver.unobserve(img);
    });
  }, {rootMargin: '120px'});
  document.querySelectorAll('img[data-src]').forEach(img=> imgObserver.observe(img));

  // Toast helper
  const toasts = document.createElement('div'); toasts.className='toast-container'; document.body.appendChild(toasts);
  window.showToast = function(msg, timeout=3000){
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg; toasts.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(), 220); }, timeout);
  };

  // expose a small init hook for re-binding dynamically added project cards
  window.UI = { addTilt, showToast };
  // Theme selector: persist and apply
  const themeSelects = document.querySelectorAll('#theme-select');
  function applyTheme(name){
    const root = document.documentElement;
    root.classList.remove('theme-default','theme-dark','theme-warm');
    root.classList.add('theme-' + (name || 'default'));
  }
  function loadTheme(){
    try{ return localStorage.getItem('site:theme') || 'default'; }catch(e){return 'default'}
  }
  function saveTheme(name){ try{ localStorage.setItem('site:theme', name); }catch(e){} }
  const current = loadTheme(); applyTheme(current);
  themeSelects.forEach(s=>{
    s.value = current;
    s.addEventListener('change', ()=>{ applyTheme(s.value); saveTheme(s.value); });
  });
})();
