// =========================================================
// NMFT STUDIO — SITE.JS
// Comportamiento compartido entre index.html y /blog/:
// fondo estrellado, año del footer, reveal-on-scroll.
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Año automático en el footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Fondo estrellado (cosmos)
  const starsEl = document.getElementById('stars');
  if (starsEl) {
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      const size = Math.random() * 1.5 + 0.5;
      s.style.width = s.style.height = size + 'px';
      s.style.animationDuration = (2 + Math.random() * 4) + 's';
      s.style.animationDelay = (Math.random() * 4) + 's';
      starsEl.appendChild(s);
    }
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  }
});
