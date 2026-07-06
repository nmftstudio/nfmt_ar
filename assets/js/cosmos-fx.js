// =========================================================
// NMFT STUDIO — COSMOS-FX.JS
// Efectos sutiles sobre el fondo estrellado (.cosmos):
//   - Estrella fugaz: cruce rápido (~1s), random, poco frecuente.
//   - Satélite: cruce lento (~10-16s) con titileo, random, muy poco frecuente.
// Se auto-inicializa si encuentra un contenedor .cosmos en la página.
// No depende de site.js / home.js / promo-app.js: es aditivo.
// =========================================================

(function () {
  function iniciarCosmosFx() {
    var contenedor = document.querySelector('.cosmos');
    if (!contenedor) return;

    // Respeta preferencia de reducción de movimiento
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // ---------- Estrella fugaz ----------
    function crearEstrellaFugaz() {
      var estrella = document.createElement('div');
      estrella.className = 'estrella-fugaz';

      var startX = Math.random() * window.innerWidth;
      var startY = Math.random() * (window.innerHeight * 0.45);
      var angulo = 20 + Math.random() * 20; // 20°-40°
      var distancia = 220 + Math.random() * 220;

      estrella.style.left = startX + 'px';
      estrella.style.top = startY + 'px';
      estrella.style.setProperty('--angulo', angulo + 'deg');
      estrella.style.setProperty('--distancia', distancia + 'px');

      contenedor.appendChild(estrella);
      setTimeout(function () { estrella.remove(); }, 1200);
    }

    function loopEstrellasFugaces() {
      crearEstrellaFugaz();
      // Entre ~18 y ~48 segundos, sin patrón fijo
      var siguiente = 18000 + Math.random() * 30000;
      setTimeout(loopEstrellasFugaces, siguiente);
    }

    // ---------- Satélite ----------
    function crearSatelite() {
      var satelite = document.createElement('div');
      satelite.className = 'cosmos-satelite';

      var w = window.innerWidth;
      var h = window.innerHeight;

      // Entra por un borde random (izq/der) y cruza casi horizontal,
      // con una leve inclinación hacia arriba o abajo.
      var desdeIzquierda = Math.random() < 0.5;
      var startY = Math.random() * h * 0.7;
      var startX = desdeIzquierda ? -20 : w + 20;
      var dx = (desdeIzquierda ? 1 : -1) * (w + 60);
      var dy = (Math.random() - 0.5) * h * 0.35;
      var duracion = 10 + Math.random() * 6; // 10s a 16s, bien lento

      satelite.style.left = startX + 'px';
      satelite.style.top = startY + 'px';
      satelite.style.setProperty('--dx', dx + 'px');
      satelite.style.setProperty('--dy', dy + 'px');
      satelite.style.setProperty('--duracion', duracion + 's');

      contenedor.appendChild(satelite);
      setTimeout(function () { satelite.remove(); }, duracion * 1000 + 200);
    }

    function loopSatelites() {
      crearSatelite();
      // Mucho más espaciado que la fugaz: entre ~45s y ~110s
      var siguiente = 45000 + Math.random() * 65000;
      setTimeout(loopSatelites, siguiente);
    }

    // Delays iniciales random para que no arranquen siempre igual
    // ni coincidan entre sí al cargar la página.
    setTimeout(loopEstrellasFugaces, 4000 + Math.random() * 6000);
    setTimeout(loopSatelites, 8000 + Math.random() * 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarCosmosFx);
  } else {
    iniciarCosmosFx();
  }
})();
