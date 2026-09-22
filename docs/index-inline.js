(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.line').forEach((l, i) => {
    setTimeout(() => l.classList.add('in'), reduced ? 0 : 150 + i * 105);
  });

  const track = document.getElementById('mqTrack');
  track.innerHTML += track.innerHTML;

  if (!reduced && window.matchMedia('(hover:hover)').matches){
    document.querySelectorAll('.btn-accent, .btn-soft, .btn-quiet, .btn-cv, .toggle').forEach(el => {
      el.addEventListener('mousemove', ev => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(ev.clientX - r.left - r.width/2) * 0.12}px, ${(ev.clientY - r.top - r.height/2) * 0.16}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  const bar = document.querySelector('.bar');
  let past = false;
  window.addEventListener('scroll', () => {
    const now = window.scrollY > 40;
    if (now !== past) { bar.style.boxShadow = now ? 'var(--shadow)' : 'var(--shadow-sm)'; past = now; }
  }, { passive: true });

  /* ================= CAROUSEL ================= */
  const carousel = document.getElementById('procCarousel');
  const slides = Array.from(document.querySelectorAll('#cTrack .cslide'));
  const stagesBox = document.getElementById('cStages');
  const counter = document.getElementById('cCount');
  const total = slides.length;
  const AUTOPLAY_MS = 4600;
  let active = 0, timer = null, paused = false;
  const pad = n => String(n).padStart(2, '0');

  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'cstage';
    b.setAttribute('role', 'tab');
    b.innerHTML = `<i>${pad(i + 1)}</i><span>${s.dataset.stage}</span>`;
    b.addEventListener('click', () => { goTo(i); restart(); });
    stagesBox.appendChild(b);
  });
  const stages = Array.from(stagesBox.children);

  function readVar(name, fallback){
    const v = parseFloat(getComputedStyle(carousel).getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  }

  function place(){
    const RX = readVar('--rx', 430), RY = readVar('--ry', 136), half = readVar('--half', 2);
    const maxDist = half + 1;
    slides.forEach((el, i) => {
      let off = i - active;
      if (off > total / 2) off -= total;
      if (off < -total / 2) off += total;
      const dist = Math.abs(off);
      if (dist > half){
        el.style.opacity = '0';
        el.style.transform = `translate(-50%,-50%) translate(0px, ${-RY * 0.4}px) scale(.8)`;
        el.style.zIndex = '0';
        el.dataset.hidden = 'true';
        el.setAttribute('aria-hidden', 'true');
        el.tabIndex = -1;
        el.classList.remove('is-active');
        el.setAttribute('aria-selected', 'false');
        return;
      }
      const angle = (off / (half * 2 + 1)) * Math.PI;
      const x = Math.sin(angle) * RX, y = -Math.cos(angle) * RY;
      const scale = Math.max(0, 1 - (dist / maxDist) * 0.3);
      const opacity = Math.max(0.3, 1 - (dist / maxDist) * 0.7);
      el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(10 - dist);
      el.dataset.hidden = 'false';
      el.removeAttribute('aria-hidden');
      el.tabIndex = 0;
      const isActive = i === active;
      el.classList.toggle('is-active', isActive);
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    counter.textContent = pad(active + 1);
    stages.forEach((s, i) => {
      const on = i === active;
      s.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && stagesBox.scrollWidth > stagesBox.clientWidth){
        stagesBox.scrollTo({ left: s.offsetLeft - (stagesBox.clientWidth - s.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  }

  function goTo(i){ active = ((i % total) + total) % total; place(); }
  const next = () => goTo(active + 1), prev = () => goTo(active - 1);
  function start(){ if (reduced || paused || timer) return; timer = setInterval(next, AUTOPLAY_MS); }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } }
  function restart(){ stop(); start(); }

  slides.forEach((el, i) => el.addEventListener('click', () => { goTo(i); restart(); }));
  document.getElementById('cNext').addEventListener('click', () => { next(); restart(); });
  document.getElementById('cPrev').addEventListener('click', () => { prev(); restart(); });
  if (window.matchMedia('(hover:hover)').matches){
    carousel.addEventListener('mouseenter', () => { paused = true; stop(); });
    carousel.addEventListener('mouseleave', () => { paused = false; start(); });
    carousel.addEventListener('focusin', () => { paused = true; stop(); });
    carousel.addEventListener('focusout', e => { if (!carousel.contains(e.relatedTarget)) { paused = false; start(); } });
  }
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'){ e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  });
  let sx = 0, sy = 0;
  carousel.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
  carousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); restart(); }
  }, {passive:true});
  window.addEventListener('resize', place);
  place();
  new IntersectionObserver(en => en.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.25 }).observe(carousel);
})();
