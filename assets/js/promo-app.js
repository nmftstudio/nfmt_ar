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

  const priceEl = document.getElementById('priceCounter');
  if (priceEl) {
    const targetValue = 600000;
    const duration = 1500;
    const startTime = performance.now();

    function formatCurrency(n) {
      return Math.round(n).toLocaleString('es-AR');
    }

    function runCounter(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      priceEl.textContent = formatCurrency(targetValue * easeOutCubic);
      if (progress < 1) requestAnimationFrame(runCounter);
    }

    requestAnimationFrame(runCounter);
  }

  function updatePhoneTime() {
    const phoneTimeEl = document.getElementById('phoneTime');
    if (!phoneTimeEl) return;
    try {
      const now = new Date();
      phoneTimeEl.textContent = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (_) {}
  }

  updatePhoneTime();
  setInterval(updatePhoneTime, 10000);

  const phone = document.getElementById('phoneMock');
  const stage = document.querySelector('.phone-stage');
  if (phone && stage && window.matchMedia('(hover: hover)').matches) {
    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      phone.style.transform = `rotate(${x * 5}deg) translateY(${y * -10}px)`;
    });
    stage.addEventListener('mouseleave', () => {
      phone.style.transform = '';
    });
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

  const WHATSAPP_NUMBER = '5493546530511';
  const waMsg = encodeURIComponent('Hola! Quiero reservar mi cupo de la promo de app por $600.000.');
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  ['cta-header', 'cta-hero', 'cta-final'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = waHref;
  });

  const confettiTrigger = document.getElementById('confettiTrigger');
  const confettiContainer = document.getElementById('phoneConfetti');
  const confettiButton = document.getElementById('confettiButton');
  let lastConfettiFire = 0;

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  const CONFETTI_COLORS = ['#ff5ebf', '#43f7ff', '#ffe15e', '#7cff6d', '#ff8b4b', '#9a6cff'];
  const CONFETTI_SHAPES = ['rect', 'square', 'circle'];

  function createConfettiPiece() {
    const piece = document.createElement('span');
    const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
    piece.className = `confetti-piece confetti-${shape}`;
    const size = randomBetween(5, 9);
    piece.style.width = `${size}px`;
    piece.style.height = shape === 'rect' ? `${size * randomBetween(1.8, 2.6)}px` : `${size}px`;
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.left = `${randomBetween(20, 80)}%`;
    piece.style.top = `${randomBetween(4, 22)}%`;
    piece.style.setProperty('--rot0', `${randomBetween(0, 360)}deg`);
    piece.style.setProperty('--drift-x', `${randomBetween(-90, 90)}px`);
    piece.style.setProperty('--fall-y', `${randomBetween(170, 280)}px`);
    piece.style.setProperty('--spin', `${randomBetween(-520, 520)}deg`);
    piece.style.animationDelay = `${randomBetween(0, 0.1)}s`;
    piece.style.animationDuration = `${randomBetween(1.1, 1.7)}s`;
    piece.addEventListener('animationend', () => piece.remove());
    return piece;
  }

  function launchConfetti() {
    if (!confettiContainer) return;
    const now = performance.now();
    if (now - lastConfettiFire < 150) return; // evita doble disparo del mismo toque (no bloquea toques nuevos)
    lastConfettiFire = now;

    if (confettiTrigger) {
      confettiTrigger.classList.remove('confetti-pop');
      void confettiTrigger.offsetWidth; // reinicia la animación aunque toques rápido varias veces
      confettiTrigger.classList.add('confetti-pop');
    }

    for (let i = 0; i < 34; i += 1) {
      confettiContainer.appendChild(createConfettiPiece());
    }
  }

  if (confettiTrigger) {
    confettiTrigger.addEventListener('pointerdown', launchConfetti);
  }

  const CHARGE_MS = 1400;
  let chargeTimer = null;
  const chargeDots = confettiButton ? Array.from(confettiButton.querySelectorAll('.confetti-charge-dot')) : [];

  function startCharge() {
    if (!confettiButton) return;
    confettiButton.classList.remove('ready', 'charging');
    clearTimeout(chargeTimer);

    const step = CHARGE_MS / (chargeDots.length || 1);
    chargeDots.forEach((dot, i) => {
      dot.style.animationDelay = `${Math.round(i * step)}ms`;
    });

    void confettiButton.offsetWidth; // fuerza reflow para poder reiniciar la animación
    confettiButton.classList.add('charging');

    chargeTimer = setTimeout(() => {
      confettiButton.classList.add('ready');
    }, CHARGE_MS);
  }

  if (confettiButton) {
    confettiButton.addEventListener('click', () => {
      if (!confettiButton.classList.contains('ready')) return;
      launchConfetti();
      startCharge();
    });
    startCharge();
  }
});
