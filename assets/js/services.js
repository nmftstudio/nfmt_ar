document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => observer.observe(el));

  // Cada pagina define window.NMFT_WA_MESSAGE antes de cargar este script
  // para personalizar el texto del mensaje de WhatsApp.
  const WHATSAPP_NUMBER = '5493546530511';
  const waMsg = encodeURIComponent(window.NMFT_WA_MESSAGE || 'Hola! Quiero consultar por un servicio de NMFT Studio.');
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  document.querySelectorAll('[data-wa-cta]').forEach((el) => {
    el.href = waHref;
  });
});
