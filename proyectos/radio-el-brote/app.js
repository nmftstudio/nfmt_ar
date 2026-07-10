/**
 * ============================================
 *  Radio Comunitaria El Brote 90.3 FM
 *  App Principal — Android (Capacitor)
 *
 *  Desarrollado por nmftSTUDIO
 *  nmftstudio@gmail.com
 *  https://nmftstudio.great-site.net
 * ============================================
 */

// ============================================
// GOOGLE ANALYTICS 4 — Wrapper seguro
// gtag() es inyectado por index.html.
// Este wrapper evita errores si GA no cargó
// (sin internet, bloqueador de anuncios, etc.)
// ============================================
function trackRadioEvent(eventName, params = {}) {
    try {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    } catch (e) {
        console.warn('GA4 trackEvent error:', e);
    }
}

// ============================================
// RADIO PLUGIN NATIVO + MUSIC CONTROLS
// Arquitectura de dos capas para segundo plano:
//
//  1. RadioPlugin (Java Foreground Service):
//     Mantiene el stream vivo aunque Android mate
//     el WebView. Es el motor principal de audio.
//
//  2. MusicControls (plugin Capacitor):
//     Muestra la notificación con controles en la
//     barra de estado. Complemento visual del servicio.
//
//  En web (navegador): solo usa el <audio> del DOM.
// ============================================
let RadioPlugin   = null;
let MusicControls = null;
let musicControlsListener = null;

async function initMusicControls() {
    try {
        const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
        const plugins  = window.Capacitor && window.Capacitor.Plugins;

        if (isNative && plugins) {
            // Plugin nativo propio (Foreground Service Java)
            if (plugins.RadioPlugin) {
                RadioPlugin = plugins.RadioPlugin;
                console.log('📻 RadioPlugin nativo cargado.');
            } else {
                console.warn('⚠️ RadioPlugin no encontrado — asegurate de compilar la app.');
            }

            // Plugin MusicControls para la notificación visual
            if (plugins.MusicControls) {
                MusicControls = plugins.MusicControls;
                console.log('🎵 MusicControls cargado.');
            }
        } else {
            console.log('ℹ️ Corriendo en web: plugins nativos no activos.');
        }
    } catch (e) {
        console.warn('⚠️ Error al inicializar plugins:', e);
    }
}

async function activarNotificacionRadio() {
    // 1. Iniciar el Foreground Service nativo (motor de audio en segundo plano)
    if (RadioPlugin) {
        try {
            await RadioPlugin.play();
            console.log('▶️ RadioPlugin.play() — Foreground Service iniciado.');
        } catch (e) {
            console.warn('⚠️ RadioPlugin.play() falló:', e);
        }
    }

    // 2. Activar notificación visual (MusicControls)
    if (!MusicControls) return;
    try {
        await MusicControls.create({
            track:            'Radio El Brote 90.3 FM',
            artist:           'En vivo · Villa Ciudad Parque',
            cover:            'https://elbrote.org/wp-content/uploads/2025/08/radio-comunitaria-elbrote-3.png',
            isPlaying:        true,
            dismissable:      false,
            hasPrev:          false,
            hasNext:          false,
            hasClose:         true,
            playIcon:         'media_play',
            pauseIcon:        'media_pause',
            closeIcon:        'media_close',
            notificationIcon: 'mr_ic_notification',
            ticker:           'Escuchando Radio El Brote 90.3 FM'
        });

        musicControlsListener = await MusicControls.addListener(
            'controlsNotification',
            (info) => {
                console.log('🔔 MusicControls evento:', info.message);
                switch (info.message) {
                    case 'music-controls-play':
                        startPlayback();
                        break;
                    case 'music-controls-pause':
                        stopPlayback();
                        break;
                    case 'music-controls-destroy':
                    case 'music-controls-media-button':
                        stopPlayback();
                        break;
                }
            }
        );

        console.log('🔔 Notificación MusicControls activada.');
    } catch (e) {
        console.warn('⚠️ Error al activar MusicControls:', e);
    }
}

async function actualizarEstadoNotificacion(isPlaying) {
    if (MusicControls) {
        try {
            await MusicControls.updateIsPlaying({ isPlaying });
        } catch (e) {
            console.warn('⚠️ Error al actualizar estado MusicControls:', e);
        }
    }
}

async function desactivarNotificacionRadio() {
    // 1. Detener el Foreground Service nativo
    if (RadioPlugin) {
        try {
            await RadioPlugin.stop();
            console.log('⏹️ RadioPlugin.stop() — Foreground Service detenido.');
        } catch (e) {
            console.warn('⚠️ RadioPlugin.stop() falló:', e);
        }
    }

    // 2. Destruir la notificación visual
    if (!MusicControls) return;
    try {
        if (musicControlsListener) {
            musicControlsListener.remove();
            musicControlsListener = null;
        }
        await MusicControls.destroy();
        console.log('🔕 Notificación de radio desactivada.');
    } catch (e) {
        console.warn('⚠️ Error al destruir MusicControls:', e);
    }
}

// ============================================
// MANEJO DE VISIBILIDAD DE PÁGINA
// Cuando el usuario vuelve a la app desde segundo
// plano, verificamos si el audio WebView sigue vivo
// y reconectamos si es necesario.
// ============================================
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && STATE.isPlaying) {
        // La app volvió al primer plano: reanudar AudioContext si fue suspendido
        if (STATE.audioContext && STATE.audioContext.state === 'suspended') {
            STATE.audioContext.resume().catch(e => {
                console.warn('⚠️ No se pudo reanudar AudioContext:', e);
            });
        }

        // Verificar si el WebView audio sigue vivo (chequeo rápido + retry)
        const checkAndRecover = (attempt) => {
            if (elements.audio && elements.audio.paused && STATE.isPlaying) {
                console.log(`🔄 WebView audio muerto al volver al frente — reconectando (intento ${attempt})...`);
                elements.audio.load();
                elements.audio.play().catch(e => {
                    console.warn('⚠️ No se pudo reanudar el audio del WebView:', e);
                    // Reintentar una vez más después de 2s
                    if (attempt < 2) {
                        setTimeout(() => checkAndRecover(attempt + 1), 2000);
                    }
                });
            }
        };

        setTimeout(() => checkAndRecover(1), 300);
    }
});

// ============================================
// CONFIG & ESTADO
// ============================================
const CONFIG = {
    streamUrl: 'https://radios.solumedia.com:6260/stream',
    version: '2.0.0'
};

const STATE = {
    isPlaying: false,
    currentVolume: 1,
    isDraggingVolume: false,
    theme: localStorage.getItem('theme') || 'dark',
    visualizerMode: localStorage.getItem('visualizerMode') || 'bars',
    audioContext: null,
    analyser: null,
    reconnectAttempts: 0
};

let reconnectTimeout = null;

let elements = {};
let particles = [];
let particlesCtx;
let visualizerCtx, dataArray, bufferLength;
let startAngleVolume = 0;
let currentRotationVolume = 0;

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    initializeElements();
    initializeTheme();
    initializeAudio();
    initializeVisualizer();
    initializeParticles();
    initializeControls();
    initializeMenu();
    initializeSettings();
    initializeMediaSession();

    // Inicializar plugin de segundo plano
    initMusicControls();

    setTimeout(() => {
        elements.volumeBar.style.width = '83.33%';
    }, 100);

    // Estadísticas de stream
    streamStats.init();

    // --- RECONEXIÓN AUTOMÁTICA ---
    if (elements.audio) {
        elements.audio.addEventListener('error', (e) => {
            console.error('⚠️ Error de audio:', e);
            if (STATE.isPlaying && STATE.reconnectAttempts < 5) {
                STATE.reconnectAttempts++;
                console.log(`🔄 Reconectando automáticamente (${STATE.reconnectAttempts}/5)...`);
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    elements.audio.load();
                    startPlayback();
                }, 3000);
            }
        });

        elements.audio.addEventListener('stalled', () => {
            console.warn('⚠️ Stream estancado, recargando...');
            if (STATE.isPlaying) {
                elements.audio.load();
            }
        });

        elements.audio.addEventListener('waiting', () => {
            console.log('⏳ Buffering...');
        });

        elements.audio.addEventListener('playing', () => {
            console.log('▶️ Reproduciendo');
            STATE.reconnectAttempts = 0;
        });
    }

    console.log('🎵 Radio El Brote v' + CONFIG.version + ' initialized!');
});

// ============================================
// ELEMENTOS DOM
// ============================================
function initializeElements() {
    elements = {
        audio: document.getElementById('radio-stream'),
        powerSwitch: document.getElementById('power-switch'),
        onLight: document.getElementById('on-light'),
        volumeKnob: document.getElementById('volume-knob'),
        volumeBar: document.getElementById('volume-bar'),
        speakerMesh: document.querySelector('.mesh'),
        menuBtn: document.getElementById('menu-btn'),
        closeMenuBtn: document.getElementById('close-menu'),
        menuOverlay: document.getElementById('menu-overlay'),
        visualizerDisplay: document.querySelector('.visualizer-display'),
        visualizerCanvas: document.getElementById('visualizer'),
        particlesCanvas: document.getElementById('particles'),
        themeToggle: document.getElementById('theme-toggle'),
        themeCheckbox: document.getElementById('theme-checkbox'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsPanel: document.getElementById('settings-panel'),
        closeSettings: document.getElementById('close-settings'),
        visualizerModeSelect: document.getElementById('visualizer-mode')
    };
}

// ============================================
// TEMA
// ============================================
function initializeTheme() {
    applyTheme(STATE.theme);

    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    if (elements.themeCheckbox) {
        elements.themeCheckbox.checked = STATE.theme === 'light';
        elements.themeCheckbox.addEventListener('change', (e) => {
            applyTheme(e.target.checked ? 'light' : 'dark');
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    STATE.theme = theme;
    localStorage.setItem('theme', theme);

    if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    if (elements.themeCheckbox) {
        elements.themeCheckbox.checked = theme === 'light';
    }
}

function toggleTheme() {
    const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// ============================================
// AUDIO
// ============================================
function initializeAudio() {
    // Solo configuramos el volumen inicial.
    // El listener de error con reconexión está en DOMContentLoaded
    // para evitar duplicados.
    elements.audio.volume = STATE.currentVolume;
}

function setupAudioContext() {
    if (!STATE.audioContext) {
        STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        STATE.analyser = STATE.audioContext.createAnalyser();
        const source = STATE.audioContext.createMediaElementSource(elements.audio);
        source.connect(STATE.analyser);
        STATE.analyser.connect(STATE.audioContext.destination);
        STATE.analyser.fftSize = 128;

        // Exponer globalmente para que game.js pueda reutilizar
        // el mismo AudioContext y evitar conflictos en Android WebView
        window.__radioAudioContext = STATE.audioContext;
    }
}

async function togglePlayback() {
    if (!STATE.isPlaying) {
        await startPlayback();
    } else {
        stopPlayback();
    }
}

async function startPlayback() {
    try {
        setupAudioContext();

        if (STATE.audioContext.state === 'suspended') {
            await STATE.audioContext.resume();
        }

        await elements.audio.play();
        STATE.isPlaying = true;

        elements.powerSwitch.classList.add('active');
        elements.onLight.classList.add('active');
        elements.visualizerDisplay.classList.add('active');
        elements.speakerMesh.classList.add('vibrating');

        // GA4: registrar evento de reproducción
        trackRadioEvent('radio_play', {
            station: 'El Brote 90.3 FM',
            stream_url: CONFIG.streamUrl
        });

        updateMediaSession();
        addExtraParticles();

        // Activar notificación de segundo plano
        await activarNotificacionRadio();

    } catch (error) {
        console.error('Playback failed:', error);
        alert('No se pudo reproducir. Haz clic de nuevo para intentar.');
    }
}

function stopPlayback() {
    // GA4: registrar evento de parada con tiempo escuchado
    const listenSeconds = STATE.listenStart
        ? Math.round((Date.now() - STATE.listenStart) / 1000)
        : 0;

    trackRadioEvent('radio_stop', {
        station: 'El Brote 90.3 FM',
        listen_duration_seconds: listenSeconds
    });

    elements.audio.pause();
    STATE.isPlaying = false;
    STATE.listenStart = null;

    elements.powerSwitch.classList.remove('active');
    elements.onLight.classList.remove('active');
    elements.visualizerDisplay.classList.remove('active');
    elements.speakerMesh.classList.remove('vibrating');

    removeExtraParticles();

    // Desactivar notificación de segundo plano
    desactivarNotificacionRadio();
}

// ============================================
// VISUALIZADOR
// ============================================
function initializeVisualizer() {
    visualizerCtx = elements.visualizerCanvas.getContext('2d');
    resizeCanvas(elements.visualizerCanvas);
    window.addEventListener('resize', () => resizeCanvas(elements.visualizerCanvas));
    drawVisualizer();
}

function resizeCanvas(canvas) {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    const canvas = elements.visualizerCanvas;
    const ctx = visualizerCtx;

    if (!STATE.isPlaying || !STATE.analyser) {
        drawStaticBars(ctx, canvas);
        return;
    }

    if (!dataArray) {
        bufferLength = STATE.analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    STATE.analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (STATE.visualizerMode === 'bars') {
        drawBarsVisualizer(ctx, canvas, dataArray, bufferLength);
    } else if (STATE.visualizerMode === 'wave') {
        drawWaveVisualizer(ctx, canvas, dataArray, bufferLength);
    } else if (STATE.visualizerMode === 'circular') {
        drawCircularVisualizer(ctx, canvas, dataArray, bufferLength);
    }
}

function drawStaticBars(ctx, canvas) {
    const barCount = 32;
    const barWidth = canvas.width / barCount;
    const minHeight = 10;

    for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const barHeight = minHeight;
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.5, '#00e676');
        gradient.addColorStop(1, '#00c853');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    }
}

function drawBarsVisualizer(ctx, canvas, data, length) {
    const barWidth = canvas.width / length;

    for (let i = 0; i < length; i++) {
        const barHeight = (data[i] / 255) * canvas.height * 0.8;
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.5, '#00e676');
        gradient.addColorStop(1, '#00c853');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    }
    ctx.shadowBlur = 0;
}

function drawWaveVisualizer(ctx, canvas, data, length) {
    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';

    const sliceWidth = canvas.width / length;
    let x = 0;

    for (let i = 0; i < length; i++) {
        const v = data[i] / 255;
        const y = canvas.height / 2 + (v * canvas.height / 2 - canvas.height / 4);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawCircularVisualizer(ctx, canvas, data, length) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 4;

    for (let i = 0; i < length; i++) {
        const angle = (i / length) * Math.PI * 2;
        const barHeight = (data[i] / 255) * radius;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00c853');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}

// ============================================
// PARTÍCULAS
// ============================================
function initializeParticles() {
    particlesCtx = elements.particlesCanvas.getContext('2d');
    resizeCanvas(elements.particlesCanvas);
    window.addEventListener('resize', () => resizeCanvas(elements.particlesCanvas));

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }

    animateParticles();
}

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * elements.particlesCanvas.height;
        this.opacity = Math.random() * 0.5;
    }

    reset() {
        this.x = Math.random() * elements.particlesCanvas.width;
        this.y = -10;
        this.speed = Math.random() * 0.5 + 0.2;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5;
    }

    update() {
        this.y += this.speed;
        if (this.y > elements.particlesCanvas.height) {
            this.reset();
        }
    }

    draw() {
        particlesCtx.fillStyle = `rgba(239, 83, 80, ${this.opacity})`;
        particlesCtx.beginPath();
        particlesCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particlesCtx.fill();
    }
}

function animateParticles() {
    particlesCtx.clearRect(0, 0, elements.particlesCanvas.width, elements.particlesCanvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateParticles);
}

function addExtraParticles() {
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle());
    }
}

function removeExtraParticles() {
    particles = particles.slice(0, 50);
}

// ============================================
// CONTROLES
// ============================================
function initializeControls() {
    elements.powerSwitch.addEventListener('click', togglePlayback);

    elements.volumeKnob.addEventListener('mousedown', startDragVolume);
    elements.volumeKnob.addEventListener('touchstart', startDragVolume);
    document.addEventListener('mousemove', dragVolume);
    document.addEventListener('touchmove', dragVolume);
    document.addEventListener('mouseup', stopDragVolume);
    document.addEventListener('touchend', stopDragVolume);

    updateVolumeUI(STATE.currentVolume);
}

function startDragVolume(e) {
    e.preventDefault();
    STATE.isDraggingVolume = true;
    const rect = elements.volumeKnob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    startAngleVolume = Math.atan2(clientY - centerY, clientX - centerX);
}

function dragVolume(e) {
    if (!STATE.isDraggingVolume) return;

    const rect = elements.volumeKnob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);
    const deltaAngle = currentAngle - startAngleVolume;

    currentRotationVolume += deltaAngle * (180 / Math.PI);
    currentRotationVolume = Math.max(-135, Math.min(135, currentRotationVolume));

    elements.volumeKnob.style.transform = `rotate(${currentRotationVolume}deg)`;

    // Clampear a 1 máximo
    const volumePercent = ((currentRotationVolume + 135) / 270) * 100;
    STATE.currentVolume = Math.min(1, volumePercent / 100);
    elements.audio.volume = STATE.currentVolume;

    updateVolumeUI(STATE.currentVolume);

    startAngleVolume = currentAngle;
}

function stopDragVolume() {
    STATE.isDraggingVolume = false;
}

function updateVolumeUI(volume) {
    const volumePercent = volume * 100;
    elements.volumeBar.style.width = `${Math.min(100, volumePercent)}%`;
    elements.volumeBar.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a, #cddc39, #ffc107)';
    elements.volumeBar.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.8)';
}

// ============================================
// MENÚ
// ============================================
function initializeMenu() {
    elements.menuBtn.addEventListener('click', () => {
        elements.menuOverlay.classList.remove('hidden');
        elements.menuOverlay.classList.add('visible');
    });

    elements.closeMenuBtn.addEventListener('click', () => {
        elements.menuOverlay.classList.remove('visible');
        setTimeout(() => {
            elements.menuOverlay.classList.add('hidden');
        }, 300);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.menuOverlay.classList.remove('visible');
            setTimeout(() => {
                elements.menuOverlay.classList.add('hidden');
            }, 300);
            if (elements.settingsPanel) {
                elements.settingsPanel.classList.remove('visible');
            }
        }
    });
}

// ============================================
// CONFIGURACIÓN
// ============================================
function initializeSettings() {
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            elements.settingsPanel.classList.add('visible');
        });
    }

    if (elements.closeSettings) {
        elements.closeSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.remove('visible');
        });
    }

    if (elements.visualizerModeSelect) {
        elements.visualizerModeSelect.value = STATE.visualizerMode;
        elements.visualizerModeSelect.addEventListener('change', (e) => {
            STATE.visualizerMode = e.target.value;
            localStorage.setItem('visualizerMode', STATE.visualizerMode);
        });
    }
}

// ============================================
// MEDIA SESSION API
// Permite controlar la radio desde la pantalla
// de bloqueo y notificaciones de Android.
// ============================================
function initializeMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Radio El Brote',
            artist: 'Radio Comunitaria El Brote',
            album: '90.3 FM',
            artwork: [
                {
                    src: 'https://elbrote.org/wp-content/uploads/2025/08/radio-comunitaria-elbrote-3.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        });

        navigator.mediaSession.setActionHandler('play', startPlayback);
        navigator.mediaSession.setActionHandler('pause', stopPlayback);
        navigator.mediaSession.setActionHandler('stop', stopPlayback);
    }
}

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = STATE.isPlaying ? 'playing' : 'paused';
    }
}

// ============================================
// MONITOR DE CONEXIÓN Y BUFFER ADAPTATIVO
// ============================================
const connectionMonitor = {
    indicator: null,
    dot: null,
    statusText: null,
    statsText: null,
    bufferFill: null,
    quality: 'unknown',
    bufferHealth: 0,
    lastUpdateTime: Date.now(),
    hideTimeout: null,

    init() {
        this.indicator = document.getElementById('connection-indicator');
        this.dot = document.getElementById('connection-dot');
        this.statusText = document.getElementById('connection-status');
        this.statsText = document.getElementById('connection-stats');
        this.bufferFill = document.getElementById('buffer-fill');

        this.setupAdaptiveBuffer();
        this.startMonitoring();
        this.scheduleHide();
    },

    setupAdaptiveBuffer() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            const updateBuffer = () => {
                const effectiveType = connection.effectiveType;

                if (effectiveType === '4g' || effectiveType === 'wifi') {
                    elements.audio.preload = 'auto';
                    console.log('📶 Conexión 4G/WiFi: Buffer completo');
                } else if (effectiveType === '3g') {
                    elements.audio.preload = 'metadata';
                    console.log('📶 Conexión 3G: Buffer medio');
                } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                    elements.audio.preload = 'none';
                    console.log('📶 Conexión lenta: Buffer mínimo');
                } else {
                    elements.audio.preload = 'auto';
                    console.log('📶 Conexión desconocida: Buffer por defecto');
                }

                this.updateQualityIndicator(effectiveType);
            };

            updateBuffer();
            connection.addEventListener('change', updateBuffer);
        } else {
            elements.audio.preload = 'auto';
            console.log('📶 API de conexión no disponible: Buffer completo');
        }
    },

    startMonitoring() {
        elements.audio.addEventListener('progress', () => {
            this.updateBufferStats();
        });

        elements.audio.addEventListener('waiting', () => {
            this.updateStatus('Buffering...', 'fair', '⏳ Cargando stream');
            this.show();
        });

        elements.audio.addEventListener('playing', () => {
            this.updateStatus('En vivo', 'excellent', '▶️ Reproduciendo');
            this.scheduleHide();
        });

        elements.audio.addEventListener('stalled', () => {
            this.updateStatus('Stream lento', 'poor', '⚠️ Conexión inestable');
            this.show();
        });

        elements.audio.addEventListener('error', () => {
            this.updateStatus('Sin conexión', 'offline', '❌ Error de stream');
            this.show();
        });

        elements.audio.addEventListener('canplay', () => {
            this.updateStatus('Listo', 'good', '✓ Buffer cargado');
            this.scheduleHide();
        });

        setInterval(() => {
            if (STATE.isPlaying) {
                this.updateBufferStats();
            }
        }, 1000);
    },

    updateBufferStats() {
        try {
            const buffered = elements.audio.buffered;
            if (buffered.length > 0) {
                const bufferedEnd = buffered.end(buffered.length - 1);
                const currentTime = elements.audio.currentTime;
                this.bufferHealth = bufferedEnd - currentTime;

                const bufferPercent = Math.min((this.bufferHealth / 10) * 100, 100);
                this.bufferFill.style.width = bufferPercent + '%';

                const stats = `Buffer: ${this.bufferHealth.toFixed(1)}s`;
                this.statsText.textContent = stats;

                if (this.bufferHealth > 5) {
                    this.dot.className = 'connection-dot excellent';
                } else if (this.bufferHealth > 2) {
                    this.dot.className = 'connection-dot good';
                } else if (this.bufferHealth > 0.5) {
                    this.dot.className = 'connection-dot fair';
                } else {
                    this.dot.className = 'connection-dot poor';
                }

                if (this.bufferHealth < 2 && STATE.isPlaying) {
                    this.show();
                    clearTimeout(this.hideTimeout);
                }

                console.log(`📊 Buffer: ${this.bufferHealth.toFixed(2)}s | ${bufferPercent.toFixed(0)}%`);
            }
        } catch (error) {
            console.error('Error al leer buffer:', error);
        }
    },

    updateQualityIndicator(effectiveType) {
        let quality, status;

        switch (effectiveType) {
            case '4g':
            case 'wifi':
                quality = 'excellent';
                status = 'Excelente';
                break;
            case '3g':
                quality = 'good';
                status = 'Buena';
                break;
            case '2g':
                quality = 'fair';
                status = 'Regular';
                break;
            case 'slow-2g':
                quality = 'poor';
                status = 'Lenta';
                break;
            default:
                quality = 'good';
                status = 'Normal';
        }

        this.quality = quality;
        this.statusText.textContent = status;
        this.dot.className = 'connection-dot ' + quality;
        this.statsText.textContent = `Conexión ${effectiveType || 'desconocida'}`;
    },

    updateStatus(status, quality, stats) {
        this.statusText.textContent = status;
        this.dot.className = 'connection-dot ' + quality;
        this.statsText.textContent = stats;
        this.quality = quality;
    },

    show() {
        clearTimeout(this.hideTimeout);
        this.indicator.classList.add('visible');
    },

    hide() {
        this.indicator.classList.remove('visible');
    },

    scheduleHide() {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            if (this.quality === 'excellent' || this.quality === 'good') {
                this.hide();
            }
        }, 5000);
    }
};

window.addEventListener('load', () => {
    setTimeout(() => {
        connectionMonitor.init();
    }, 1000);
});

// ============================================
// ESTADÍSTICAS AVANZADAS DE STREAM
// ============================================
const streamStats = {
    startTime: null,
    totalPlayTime: 0,
    bufferingTime: 0,
    reconnections: 0,
    lastBufferUpdate: Date.now(),

    init() {
        elements.audio.addEventListener('playing', () => {
            if (!this.startTime) this.startTime = Date.now();
            // Guardar timestamp de inicio de escucha para GA4
            if (!STATE.listenStart) STATE.listenStart = Date.now();
        });

        elements.audio.addEventListener('waiting', () => {
            this.lastBufferUpdate = Date.now();
        });

        elements.audio.addEventListener('playing', () => {
            if (this.lastBufferUpdate) {
                const bufferDuration = Date.now() - this.lastBufferUpdate;
                this.bufferingTime += bufferDuration;
                this.lastBufferUpdate = null;
            }
        });

        setInterval(() => {
            if (STATE.isPlaying) {
                this.logStats();
            }
        }, 30000);
    },

    logStats() {
        const totalTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        const bufferPercent = totalTime > 0 ? (this.bufferingTime / 1000 / totalTime * 100) : 0;

        console.log('═══════════════════════════════════════');
        console.log('📊 ESTADÍSTICAS DE STREAM');
        console.log('═══════════════════════════════════════');
        console.log(`⏱️  Tiempo total: ${Math.floor(totalTime / 60)}m ${Math.floor(totalTime % 60)}s`);
        console.log(`⏳ Buffering: ${(this.bufferingTime / 1000).toFixed(1)}s (${bufferPercent.toFixed(1)}%)`);
        console.log(`🔄 Reconexiones: ${STATE.reconnectAttempts}`);
        console.log(`📶 Calidad: ${connectionMonitor.quality}`);
        console.log(`💾 Buffer actual: ${connectionMonitor.bufferHealth.toFixed(2)}s`);
        console.log('═══════════════════════════════════════');

        // GA4: reportar cada 30s de escucha activa
        trackRadioEvent('radio_listening', {
            station: 'El Brote 90.3 FM',
            listen_seconds: Math.floor(totalTime),
            buffer_quality: connectionMonitor.quality
        });
    }
};

// ============================================
// MINI JUEGO — Radio Runner
// nmftSTUDIO / nmftstudio@gmail.com
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const gameBtn    = document.getElementById('game-btn');
    const gameModal  = document.getElementById('game-modal');
    const gameCanvas = document.getElementById('game-canvas');
    const closeGame  = document.getElementById('close-game');
    const muteBtn    = document.getElementById('game-mute-btn');

    if (!gameBtn || !gameModal || !gameCanvas || !closeGame) {
        console.warn('Radio Runner: no se encontraron los elementos del juego.');
        return;
    }

    if (typeof RadioRunner === 'undefined') {
        console.warn('Radio Runner: game.js no está cargado.');
        return;
    }

    let started = false;

    function openGame() {
        gameModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        if (!started) {
            RadioRunner.init(gameCanvas);
            started = true;
        }
        // GA4: registrar apertura del juego
        trackRadioEvent('game_open', { game: 'Radio Runner' });
    }

    function closeGameFn() {
        gameModal.classList.remove('visible');
        document.body.style.overflow = '';
        RadioRunner.destroy();
        if (RadioRunner.isMuted()) {
            RadioRunner.toggleMute();
            muteBtn.textContent = '🔊';
            muteBtn.classList.remove('muted');
        }
        started = false;
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            RadioRunner.toggleMute();
            const muted = RadioRunner.isMuted();
            muteBtn.textContent = muted ? '🔇' : '🔊';
            muteBtn.classList.toggle('muted', muted);
        });
    }

    gameBtn.addEventListener('click', openGame);
    closeGame.addEventListener('click', closeGameFn);

    gameModal.addEventListener('click', function (e) {
        if (e.target === gameModal) closeGameFn();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && gameModal.classList.contains('visible')) {
            closeGameFn();
        }
    });

    console.log('🎮 Radio Runner listo!');
});
