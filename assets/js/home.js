document.getElementById('year').textContent = new Date().getFullYear();

const starsEl = document.getElementById('stars');
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

// ---------- Bitácora (últimos 2 posts, dinámico desde posts.json) ----------
function formatDateHome(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

const homeBlogRow = document.getElementById('homeBlogRow');
if (homeBlogRow) {
  fetch('/assets/data/posts.json')
    .then(r => r.json())
    .then(posts => {
      const ultimos = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
      homeBlogRow.innerHTML = ultimos.map(p => `
        <a class="blog-item" href="/blog/posts/${p.slug}.html" style="text-decoration: none; color: inherit;">
          <div class="blog-meta">
            <span class="blog-date">${formatDateHome(p.date)}</span>
            <h3>${p.title}</h3>
          </div>
          <span class="btn mono" style="font-size:0.65rem; padding:6px 12px;">Leer nota →</span>
        </a>
      `).join('');
    })
    .catch(() => {
      homeBlogRow.innerHTML = '<p class="empty-state">No se pudieron cargar las notas.</p>';
    });
}

const priceEl = document.getElementById('priceCounter');
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

const phone = document.getElementById('phoneMock');
const stage = document.querySelector('.phone-stage');
if (window.matchMedia('(hover: hover)').matches) {
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
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

(function () {
  const tabletStage = document.getElementById('tabletStage');
  const tabletMock = document.getElementById('tabletMock');
  const formSteps = document.getElementById('formSteps');
  const formStepsViewport = document.querySelector('.form-steps-viewport');
  const progressBar = document.getElementById('stepProgressBar');
  const stepLabels = document.querySelectorAll('.step-label');
  const steps = document.querySelectorAll('.form-step');
  const totalSteps = steps.length;
  const form = document.getElementById('contactForm');
  const feedbackEl = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');
  let current = 1;

  function showFeedback(type, msg) {
    feedbackEl.textContent = msg;
    feedbackEl.className = 'form-feedback ' + type;
    feedbackEl.style.display = 'block';
    syncViewportHeight();
  }
  function hideFeedback() {
    feedbackEl.style.display = 'none';
    syncViewportHeight();
  }
  function syncViewportHeight() {
    const activeStep = steps[current - 1];
    if (activeStep) formStepsViewport.style.height = activeStep.scrollHeight + 'px';
  }
  function goTo(step) {
    current = step;
    formSteps.style.transform = `translateX(-${(step - 1) * (100 / totalSteps)}%)`;
    progressBar.style.width = (step / totalSteps * 100) + '%';
    stepLabels.forEach(l => {
      const s = parseInt(l.dataset.step, 10);
      l.classList.toggle('active', s === step);
      l.classList.toggle('done', s < step);
    });
    if (step === 3) fillSummary();
    syncViewportHeight();
  }
  window.addEventListener('resize', () => { syncViewportHeight(); });

  function validateStep(step) {
    if (step === 1) {
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      if (!name.value.trim()) { name.focus(); return false; }
      if (!email.checkValidity() || !email.value.trim()) { email.focus(); return false; }
      return true;
    }
    if (step === 2) {
      const type = document.querySelector('input[name="projectType"]:checked');
      const msg = document.getElementById('msg');
      if (!type) { showFeedback('error', 'Elegí un tipo de proyecto para continuar.'); return false; }
      if (!msg.value.trim()) { msg.focus(); return false; }
      hideFeedback();
      return true;
    }
    return true;
  }

  function fillSummary() {
    document.getElementById('sumName').textContent = document.getElementById('name').value.trim() || '—';
    document.getElementById('sumEmail').textContent = document.getElementById('email').value.trim() || '—';
    const type = document.querySelector('input[name="projectType"]:checked');
    document.getElementById('sumType').textContent = type ? type.value : '—';
    document.getElementById('sumMsg').textContent = document.getElementById('msg').value.trim() || '—';
  }

  document.querySelectorAll('.step-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(current) && current < totalSteps) goTo(current + 1);
    });
  });
  document.querySelectorAll('.step-prev').forEach(btn => {
    btn.addEventListener('click', () => { if (current > 1) { hideFeedback(); goTo(current - 1); } });
  });

  function generateCaptcha() {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    window.captchaExpected = a + b;
    document.getElementById('captchaQuestion').textContent = `${a} + ${b} = ?`;
  }
  function validateCaptcha() {
    const answer = document.getElementById('captchaAnswer').value.trim();
    return String(window.captchaExpected) === answer;
  }
  generateCaptcha();

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateCaptcha()) {
      showFeedback('error', 'El captcha no es correcto. Probá de nuevo.');
      document.getElementById('captchaAnswer').focus();
      generateCaptcha();
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    hideFeedback();

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      projectType: (document.querySelector('input[name="projectType"]:checked') || {}).value || '',
      msg: document.getElementById('msg').value.trim(),
      website: (document.getElementById('website') || {}).value || ''
    };

    fetch('/assets/php/mail.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json().catch(() => ({ ok: false, error: 'Respuesta inválida del servidor.' })))
      .then(data => {
        if (data.ok) {
          showFeedback('ok', '¡Gracias! Tu mensaje fue enviado a NMFT STUDIO. Te respondemos en el día.');
          form.reset();
          generateCaptcha();
          setTimeout(() => goTo(1), 1400);
        } else {
          showFeedback('error', data.error || 'No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.');
        }
      })
      .catch(() => {
        showFeedback('error', 'Error de conexión. Probá de nuevo o escribinos por WhatsApp.');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });

  if (window.matchMedia('(hover: hover)').matches) {
    tabletStage.addEventListener('mousemove', (e) => {
      const rect = tabletStage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tabletMock.style.transform = `rotate(${x * 4}deg) translateY(${y * -8}px)`;
    });
    tabletStage.addEventListener('mouseleave', () => { tabletMock.style.transform = ''; });
  }

  goTo(1);
})();

function updatePhoneTime() {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const phoneTimeEl = document.getElementById('phoneTime');
    if (phoneTimeEl) phoneTimeEl.textContent = timeStr;
    const tetrisPhoneTimeEl = document.getElementById('tetrisPhoneTime');
    if (tetrisPhoneTimeEl) tetrisPhoneTimeEl.textContent = timeStr;
  } catch (err) {
    console.error('Error al actualizar la hora del teléfono:', err);
  }
}
updatePhoneTime();
setInterval(updatePhoneTime, 10000);

const canvas = document.getElementById('arkCanvas');
const ctx = canvas.getContext('2d');
let ballRadius = 4;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2.13;
let dy = -2.13;
let ballSpeed = 2.13;
let paddleHeight = 6;
let paddleWidth = 40;
let paddleX = (canvas.width - paddleWidth) / 2;
let brickRowCount = 4;
let brickColumnCount = 5;
let brickWidth = 32;
let brickHeight = 10;
let brickPadding = 5;
let brickOffsetTop = 35;
let brickOffsetLeft = 10;
let score = 0;
let gameState = 'START';
const colorFluor = '#ff4fa0';
const colorTeal = '#3fa7a0';
const colorGold = '#c9a15c';
const colorMuted = '#939ba5';
let bricks = [];
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}
initBricks();
const phoneScreen = document.querySelector('.phone-screen');
function handleMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }
}
phoneScreen.addEventListener('mousemove', (e) => { handleMove(e.clientX); });
phoneScreen.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) handleMove(e.touches[0].clientX);
}, { passive: true });
phoneScreen.addEventListener('click', () => {
  if (gameState === 'START') startGame();
  else if (gameState === 'GAMEOVER' || gameState === 'WIN') resetGame();
});
document.getElementById('btnResetGame').addEventListener('click', (e) => {
  e.stopPropagation();
  resetGame();
});
function startGame() {
  ballSpeed = 2.13;
  const angle = -Math.PI / 3 - Math.random() * (Math.PI / 3);
  dx = ballSpeed * Math.cos(angle);
  dy = ballSpeed * Math.sin(angle);
  gameState = 'PLAYING';
}
function resetGame() {
  x = canvas.width / 2;
  y = canvas.height - 40;
  ballSpeed = 2.13;
  const angle = -Math.PI / 3 - Math.random() * (Math.PI / 3);
  dx = ballSpeed * Math.cos(angle);
  dy = ballSpeed * Math.sin(angle);
  paddleX = (canvas.width - paddleWidth) / 2;
  score = 0;
  initBricks();
  gameState = 'PLAYING';
}
function collisionDetection() {
  let activeBricks = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        activeBricks++;
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score += 10;
          ballSpeed *= 1.03;
          dx *= 1.03;
          dy *= 1.03;
        }
      }
    }
  }
  if (activeBricks === 0 && gameState === 'PLAYING') gameState = 'WIN';
}
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = colorFluor;
  ctx.shadowBlur = 8;
  ctx.shadowColor = colorFluor;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - 18, paddleWidth, paddleHeight);
  ctx.fillStyle = colorTeal;
  ctx.shadowBlur = 6;
  ctx.shadowColor = colorTeal;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        if (r === 0) ctx.fillStyle = colorFluor;
        else if (r === 1) ctx.fillStyle = colorTeal;
        else if (r === 2) ctx.fillStyle = colorGold;
        else ctx.fillStyle = '#4f5e71';
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
function drawScore() {
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorMuted;
  ctx.fillText('SCORE: ' + score, 10, 22);
}
function drawScreens() {
  if (gameState === 'START') {
    ctx.fillStyle = 'rgba(5, 7, 10, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 15px 'Unbounded', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('NMFT', canvas.width / 2, canvas.height / 2 - 25);
    ctx.font = "bold 7px 'JetBrains Mono', monospace";
    ctx.fillStyle = colorGold;
    ctx.fillText('ARCADE SYSTEM', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = colorFluor;
    ctx.fillText('TOCA PARA JUGAR', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
  } else if (gameState === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(5, 7, 10, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 12px 'Unbounded', sans-serif";
    ctx.fillStyle = colorFluor;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PUNTOS: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillStyle = colorGold;
    ctx.fillText('TOCA PARA REINICIAR', canvas.width / 2, canvas.height / 2 + 35);
    ctx.textAlign = 'left';
  } else if (gameState === 'WIN') {
    ctx.fillStyle = 'rgba(5, 7, 10, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 13px 'Unbounded', sans-serif";
    ctx.fillStyle = colorTeal;
    ctx.textAlign = 'center';
    ctx.fillText('¡GANASTE!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PUNTOS: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillStyle = colorGold;
    ctx.fillText('TOCA PARA REPETIR', canvas.width / 2, canvas.height / 2 + 35);
    ctx.textAlign = 'left';
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === 'START') {
    x = paddleX + paddleWidth / 2;
    y = canvas.height - 18 - paddleHeight - ballRadius;
    drawBricks();
    drawBall();
    drawPaddle();
    drawScreens();
  } else if (gameState === 'PLAYING') {
    ballSpeed += 0.0006;
    let currentSpeed = Math.sqrt(dx * dx + dy * dy);
    if (currentSpeed > 0) {
      dx = (dx / currentSpeed) * ballSpeed;
      dy = (dy / currentSpeed) * ballSpeed;
    }
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    collisionDetection();
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius + 30) dy = -dy;
    else if (y + dy > canvas.height - 18 - paddleHeight - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        let hitPoint = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        hitPoint = Math.max(-0.85, Math.min(0.85, hitPoint));
        ballSpeed *= 1.02;
        const magnitude = Math.sqrt(hitPoint * hitPoint + 1);
        dx = ballSpeed * (hitPoint / magnitude);
        dy = -ballSpeed * (1 / magnitude);
      } else if (y + dy > canvas.height - ballRadius) {
        gameState = 'GAMEOVER';
      }
    }
    x += dx;
    y += dy;
  } else {
    drawBricks();
    drawPaddle();
    drawScreens();
  }
  requestAnimationFrame(draw);
}
draw();

(function () {
  const tc = document.getElementById('tetrisCanvas');
  const tx = tc.getContext('2d');
  const TW = 20;
  const COLS = Math.floor(tc.width / TW);
  const ROWS = Math.floor(tc.height / TW);
  const COLORS = {
    I: '#3fa7a0', O: '#c9a15c', T: '#ff4fa0',
    S: '#7dde92', Z: '#e05c5c', J: '#6fa3ef', L: '#f5a623'
  };
  const PIECES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]]
  };
  const PIECE_KEYS = Object.keys(PIECES);
  let tBoard, tCurrent, tNext, tScore, tLines, tGameState, tDropInterval, tLastDrop;
  let tSwipeStartX = null, tSwipeStartY = null;
  let tEffects = []; // flash effects when a line is cleared
  let tPopup = null; // floating score popup text
  let tShakeUntil = 0; // brief screen-shake on line clear

  function createBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
  function randomPiece() {
    const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
    return { type: key, matrix: PIECES[key].map(r => [...r]), x: Math.floor(COLS / 2) - 2, y: 0 };
  }
  function rotate(matrix) {
    // True 90 degree clockwise rotation: cycles through 4 distinct positions.
    const n = matrix.length;
    return matrix.map((row, r) => row.map((_, c) => matrix[n - 1 - c][r]));
  }
  function isValid(piece, bx, by, mat) {
    const m = mat || piece.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const nx = (bx !== undefined ? bx : piece.x) + c;
        const ny = (by !== undefined ? by : piece.y) + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && tBoard[ny][nx]) return false;
      }
    }
    return true;
  }
  function lockPiece() {
    const m = tCurrent.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const ny = tCurrent.y + r;
        const nx = tCurrent.x + c;
        if (ny < 0) { tGameState = 'GAMEOVER'; return; }
        tBoard[ny][nx] = tCurrent.type;
      }
    }
    clearLines();
    tCurrent = tNext;
    tNext = randomPiece();
    if (!isValid(tCurrent, tCurrent.x, tCurrent.y)) tGameState = 'GAMEOVER';
  }
  function clearLines() {
    let cleared = 0;
    const now = performance.now();
    for (let r = ROWS - 1; r >= 0; r--) {
      if (tBoard[r].every(c => c !== 0)) {
        tEffects.push({ y: r * TW, start: now, duration: 260 });
        tBoard.splice(r, 1);
        tBoard.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800];
      const gained = pts[cleared] || 800;
      tScore += gained;
      tLines += cleared;
      tDropInterval = Math.max(80, 600 - Math.floor(tLines / 10) * 50);
      tPopup = { text: cleared >= 4 ? 'TETRIS!' : ('+' + gained), start: now, duration: 700 };
      tShakeUntil = now + 180;
    }
  }
  function ghostY() {
    let gy = tCurrent.y;
    while (isValid(tCurrent, tCurrent.x, gy + 1)) gy++;
    return gy;
  }
  function drawBoard() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tBoard[r][c]) {
          tx.fillStyle = COLORS[tBoard[r][c]];
          tx.shadowBlur = 4;
          tx.shadowColor = COLORS[tBoard[r][c]];
          tx.fillRect(c * TW + 1, r * TW + 1, TW - 2, TW - 2);
          tx.shadowBlur = 0;
        } else {
          tx.fillStyle = 'rgba(255,255,255,0.02)';
          tx.fillRect(c * TW, r * TW, TW, TW);
        }
      }
    }
  }
  function drawPieceFn(piece, alpha, offsetY) {
    const m = piece.matrix;
    tx.globalAlpha = alpha || 1;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const px = (piece.x + c) * TW;
        const py = ((offsetY !== undefined ? offsetY : piece.y) + r) * TW;
        tx.fillStyle = COLORS[piece.type];
        tx.shadowBlur = 6;
        tx.shadowColor = COLORS[piece.type];
        tx.fillRect(px + 1, py + 1, TW - 2, TW - 2);
        tx.shadowBlur = 0;
      }
    }
    tx.globalAlpha = 1;
  }
  function drawEffects(now) {
    for (let i = tEffects.length - 1; i >= 0; i--) {
      const ef = tEffects[i];
      const t = (now - ef.start) / ef.duration;
      if (t >= 1) { tEffects.splice(i, 1); continue; }
      const alpha = 1 - t;
      tx.fillStyle = `rgba(255,255,255,${(alpha * 0.85).toFixed(3)})`;
      tx.shadowBlur = 14;
      tx.shadowColor = '#ffffff';
      tx.fillRect(0, ef.y, COLS * TW, TW);
      tx.shadowBlur = 0;
    }
    if (tPopup) {
      const t = (now - tPopup.start) / tPopup.duration;
      if (t >= 1) {
        tPopup = null;
      } else {
        const alpha = 1 - t;
        const riseY = -20 * t;
        tx.save();
        tx.globalAlpha = alpha;
        tx.fillStyle = colorGold;
        tx.font = "bold 13px 'Unbounded', sans-serif";
        tx.textAlign = 'center';
        tx.shadowBlur = 8;
        tx.shadowColor = colorGold;
        tx.fillText(tPopup.text, tc.width / 2, tc.height / 2 + riseY);
        tx.restore();
      }
    }
  }
  function draw() {
    const now = performance.now();
    tx.save();
    if (tShakeUntil && now < tShakeUntil) {
      const p = (tShakeUntil - now) / 180;
      const mag = 3 * p;
      tx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
    }
    tx.clearRect(-6, -6, tc.width + 12, tc.height + 12);
    drawBoard();
    drawPieceFn(tCurrent, 1);
    drawEffects(now);
    if (tGameState === 'START') {
      tx.fillStyle = 'rgba(255,255,255,0.06)';
      tx.font = "bold 11px 'JetBrains Mono', monospace";
      tx.fillText('TOCA PARA JUGAR', 8, 20);
    }
    if (tGameState === 'GAMEOVER') {
      tx.fillStyle = 'rgba(5,7,10,0.9)';
      tx.fillRect(0, 0, tc.width, tc.height);
      tx.fillStyle = '#ffffff';
      tx.font = "bold 12px 'Unbounded', sans-serif";
      tx.textAlign = 'center';
      tx.fillText('GAME OVER', tc.width / 2, tc.height / 2 - 8);
      tx.font = "9px 'JetBrains Mono', monospace";
      tx.fillStyle = colorGold;
      tx.fillText('TOCA PARA REINICIAR', tc.width / 2, tc.height / 2 + 20);
      tx.textAlign = 'left';
    }
    tx.restore();
  }
  function drop() {
    if (!isValid(tCurrent, tCurrent.x, tCurrent.y + 1)) {
      lockPiece();
      return;
    }
    tCurrent.y += 1;
  }
  function resetTetris() {
    tBoard = createBoard();
    tCurrent = randomPiece();
    tNext = randomPiece();
    tScore = 0;
    tLines = 0;
    tGameState = 'PLAYING';
    tDropInterval = 600;
    tLastDrop = performance.now();
    tEffects = [];
    tPopup = null;
    tShakeUntil = 0;
  }
  function tick(now) {
    if (tGameState !== 'PLAYING') return;
    if (!tLastDrop || now - tLastDrop > tDropInterval) {
      drop();
      tLastDrop = now;
    }
    draw();
    requestAnimationFrame(tick);
  }
  function rotateCurrent() {
    const rotated = rotate(tCurrent.matrix);
    if (isValid(tCurrent, tCurrent.x, tCurrent.y, rotated)) tCurrent.matrix = rotated;
  }
  function initIdle() {
    tBoard = createBoard();
    tCurrent = randomPiece();
    tNext = randomPiece();
    tScore = 0;
    tLines = 0;
    tGameState = 'START';
    tEffects = [];
    tPopup = null;
    tShakeUntil = 0;
  }
  tc.addEventListener('click', () => {
    if (tGameState === 'START') {
      resetTetris();
      requestAnimationFrame(tick);
    } else if (tGameState === 'GAMEOVER') {
      resetTetris();
      requestAnimationFrame(tick);
    } else if (tGameState === 'PLAYING') {
      // Click anywhere on the board (top or bottom half) rotates the piece clockwise.
      rotateCurrent();
    }
  });
  document.getElementById('btnResetTetris').addEventListener('click', (e) => {
    e.stopPropagation();
    resetTetris();
    requestAnimationFrame(tick);
  });
  document.addEventListener('keydown', (e) => {
    if (tGameState !== 'PLAYING') return;
    if (e.key === 'ArrowLeft') {
      if (isValid(tCurrent, tCurrent.x - 1, tCurrent.y)) tCurrent.x -= 1;
    } else if (e.key === 'ArrowRight') {
      if (isValid(tCurrent, tCurrent.x + 1, tCurrent.y)) tCurrent.x += 1;
    } else if (e.key === 'ArrowDown') {
      rotateCurrent();
    } else if (e.key === 'ArrowUp') {
      rotateCurrent();
    }
  });
  tc.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      tSwipeStartX = e.touches[0].clientX;
      tSwipeStartY = e.touches[0].clientY;
    }
  });
  tc.addEventListener('touchend', (e) => {
    if (tSwipeStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - tSwipeStartX;
    const deltaY = endY - tSwipeStartY;
    if (tGameState === 'PLAYING') {
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe: move the piece left/right.
        if (deltaX > 0) {
          if (isValid(tCurrent, tCurrent.x + 1, tCurrent.y)) tCurrent.x += 1;
        } else {
          if (isValid(tCurrent, tCurrent.x - 1, tCurrent.y)) tCurrent.x -= 1;
        }
      } else {
        // Any tap or vertical swipe (top or bottom half) rotates clockwise.
        // "Tocar abajo para bajar" was removed on purpose.
        rotateCurrent();
      }
      e.preventDefault();
    }
    tSwipeStartX = null;
    tSwipeStartY = null;
  });
  initIdle();
  draw();
})();

// Mobile Menu
(function () {
  const trigger = document.getElementById('logoMenuTrigger');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (!trigger || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  menu.querySelectorAll('.mobile-menu-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  menu.addEventListener('click', (e) => {
    if (e.target === menu) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
})();
