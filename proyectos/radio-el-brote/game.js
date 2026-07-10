/**
 * ============================================
 *  RADIO RUNNER - Mini Juego 8-bit
 *  Radio Comunitaria El Brote 90.3 FM
 *
 *  Desarrollado por nmftSTUDIO
 *  nmftstudio@gmail.com
 *  https://nmftstudio.great-site.net
 * ============================================
 */

const RadioRunner = (() => {

    // ============================================
    // CONSTANTS
    // ============================================
    const W  = 480;
    const H  = 220;
    const GY = 168;          // ground Y
    const GV = 0.55;         // gravity
    const JF = -12.5;        // jump force
    const BS = 4;            // base speed
    const PS = 3;            // pixel scale (3 screen-px per game-px)

    // player sprite size in screen px
    const PW = 14 * PS;      // 42
    const PH = 20 * PS;      // 60

    // ============================================
    // STATE
    // ============================================
    let canvas, ctx;
    let state    = 'idle';   // idle | playing | dead
    let score    = 0;
    let hiScore  = 0;
    let speed    = BS;
    let tick     = 0;
    let raf      = null;

    const player = {
        x: 70, y: GY - PH, vy: 0,
        onGround: true, animTick: 0, animFrame: 0,
    };

    let obstacles   = [];
    let nextObs     = 90;
    let bgScroll1   = 0;   // clouds  (slow)
    let bgScroll2   = 0;   // builds  (med)
    let bgScroll3   = 0;   // ground  (fast)
    let scenePhase  = 0;
    let sceneTimer  = 0;
    let clouds      = [];
    let buildings   = [];

    // ============================================
    // PIXEL ART PALETTE
    // ============================================
    const C = {
        '.': null,
        'R': '#D32F2F',  // radio red
        'r': '#8B0000',  // dark red
        'G': '#43A047',  // plant green
        'g': '#1B5E20',  // dark green
        'W': '#ECEFF1',  // white
        'B': '#212121',  // black
        'D': '#78909C',  // legs gray
        'd': '#455A64',  // dark leg
        'b': '#6D4C41',  // stem brown
        'C': '#00ACC1',  // headphone cyan
        'c': '#006064',  // dark cyan
        'Y': '#FDD835',  // yellow
        'K': '#546E7A',  // dark gray
        'k': '#37474F',  // darker gray
        'V': '#7B1FA2',  // vinyl purple
        'v': '#4A148C',  // dark vinyl
        'S': '#FF7043',  // speaker orange
        'T': '#BF360C',  // dark orange
        'L': '#FFEE58',  // light yellow
        'X': '#FF5252',  // dead-eye red
        'P': '#FF80AB',  // pink accent
        'N': '#263238',  // near-black
    };

    // ============================================
    // SPRITES  (14 wide × 20 tall)
    // ============================================

    // Run frame 0
    const SPR_RUN0 = [
        '..GG.....GGG..',
        '.GGGGGGGGGGG..',
        '..GGGGGGGGG...',
        '....bbbbbbb...',
        '.....bbbbb....',
        'CCCCRRRRRRRR..',
        'CRRRRRRRRRRRR.',
        'CR.WW....WW.R.',
        'CR.BB....BB.R.',
        'CRRRRRRRRRRRR.',
        'CRRRRRRRRRRRR.',
        'CR.RR.RR.RR.R.',
        '.RRRRRRRRRRRR.',
        '.RRRRRRRRRR...',
        '..RRRRRRRRR...',
        '...D......D...',
        '...D......D...',
        '..D........D..',
        '.D..........D.',
        '..............',
    ];

    // Run frame 1
    const SPR_RUN1 = [
        '..GG.....GGG..',
        '.GGGGGGGGGGG..',
        '..GGGGGGGGG...',
        '....bbbbbbb...',
        '.....bbbbb....',
        'CCCCRRRRRRRR..',
        'CRRRRRRRRRRRR.',
        'CR.WW....WW.R.',
        'CR.BB....BB.R.',
        'CRRRRRRRRRRRR.',
        'CRRRRRRRRRRRR.',
        'CR.RR.RR.RR.R.',
        '.RRRRRRRRRRRR.',
        '.RRRRRRRRRR...',
        '..RRRRRRRRR...',
        '.....DD.DD....',
        '....D....D....',
        '...D......D...',
        '..............',
        '..............',
    ];

    // Jump
    const SPR_JUMP = [
        '..GG.....GGG..',
        '.GGGGGGGGGGG..',
        '..GGGGGGGGG...',
        '....bbbbbbb...',
        '.....bbbbb....',
        'CCCCRRRRRRRR..',
        'CRRRRRRRRRRRR.',
        'CR.WW....WW.R.',
        'CR.BB....BB.R.',
        'CRRRRRRRRRRRR.',
        'CRRRRRRRRRRRR.',
        'CR.RR.RR.RR.R.',
        '.RRRRRRRRRRRR.',
        '.RRRRRRRRRR...',
        '..RRRRRRRRR...',
        '....DDDDDD....',
        '...D......D...',
        '..D........D..',
        '..............',
        '..............',
    ];

    // Dead
    const SPR_DEAD = [
        '..GG.....GGG..',
        '.GGGGGGGGGGG..',
        '..GGGGGGGGG...',
        '....bbbbbbb...',
        '.....bbbbb....',
        'CCCCRRRRRRRR..',
        'CRRRRRRRRRRRR.',
        'CR.Xr....rX.R.',
        'CR.rX....Xr.R.',
        'CRRRRRRRRRRRR.',
        'CRRRRRRRRRRRR.',
        'CR.RR.RR.RR.R.',
        '.RRRRRRRRRRRR.',
        '.RRRRRRRRRR...',
        '..RRRRRRRRR...',
        '...D.D..D.D...',
        '..D.D....D.D..',
        '.D............',
        '..............',
        '..............',
    ];

    // Vinyl obstacle (15 × 15)
    const SPR_VINYL = [
        '....VVVVVVV....',
        '...VWWWWWWWV...',
        '..VWWvVVVvWWV..',
        '.VWWvV.V.VvWV..',
        '.VWVv....VvWV..',
        'VVWv...B..VWV..',
        'VVWv..BBB.VWV..',
        'VVWv...B..VWV..',
        'VVWv....VvWV...',
        '.VWVv.VVvvWV...',
        '.VWWvVVVVVWvV..',
        '..VWWWWWWWWvV..',
        '...VWWWWWWWvV..',
        '....VVVVVVVvV..',
        '.....VvvvvvV...',
    ];

    // Speaker obstacle (16 × 18)
    const SPR_SPEAKER = [
        'KKKKKKKKKKKKKKKK',
        'K..KKKKKKKKKK..K',
        'K..K.SSSSSS.K..K',
        'K..K.S.TTT.SK..K',
        'K..K.S.TBT.SK..K',
        'K..K.S.TWB.SK..K',
        'K..K.S.TBT.SK..K',
        'K..K.S.TTT.SK..K',
        'K..K.SSSSSS.K..K',
        'K..KKKKKKKKKK..K',
        'KKKKKKKKKKKKKKKK',
        '.KKKKKKKKKKKKKK.',
        '..KK.K.K.K.KKK..',
        '..KKKKKKKKKKK...',
        '...DD.....DD....',
        '...D.......D....',
        '..D.........D...',
        '.DDD.......DDD..',
    ];

    function drawSprite(data, x, y, ps) {
        for (let row = 0; row < data.length; row++) {
            const line = data[row];
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                if (ch !== '.' && C[ch]) {
                    ctx.fillStyle = C[ch];
                    ctx.fillRect(Math.floor(x + col * ps), Math.floor(y + row * ps), ps, ps);
                }
            }
        }
    }

    // ============================================
    // SCENES / BACKGROUNDS
    // ============================================
    const SCENES = [
        { name:'Día',      sky1:'#87CEEB', sky2:'#C9EAF9', gnd:'#7CB342', gline:'#558B2F', bld:'#90A4AE', win:'#FFF9C4', stars:false },
        { name:'Tarde',    sky1:'#FF6B35', sky2:'#FFAB40', gnd:'#A1887F', gline:'#795548', bld:'#5D4037', win:'#FF8F00', stars:false },
        { name:'Noche',    sky1:'#0D1B3E', sky2:'#1A237E', gnd:'#263238', gline:'#1C313A', bld:'#152033', win:'#FDD835', stars:true  },
        { name:'Amanecer', sky1:'#EC407A', sky2:'#F8BBD0', gnd:'#66BB6A', gline:'#388E3C', bld:'#6A1B9A', win:'#FFF176', stars:false },
    ];

    function initScenery() {
        clouds    = [];
        buildings = [];
        for (let i = 0; i < 7; i++) {
            clouds.push({ x: Math.random() * W * 1.6, y: 12 + Math.random() * 55, w: 36 + Math.random() * 64, h: 16 + Math.random() * 24 });
        }
        for (let i = 0; i < 14; i++) {
            buildings.push({ x: i * 48 + Math.random() * 18, w: 20 + Math.floor(Math.random() * 36), h: 28 + Math.floor(Math.random() * 90), wc: Math.floor(Math.random() * 3) + 1 });
        }
    }

    function drawBackground() {
        const sc = SCENES[scenePhase];

        // Sky
        const gr = ctx.createLinearGradient(0, 0, 0, GY);
        gr.addColorStop(0, sc.sky1);
        gr.addColorStop(1, sc.sky2);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, GY + 2);

        // Stars
        if (sc.stars) {
            for (let i = 0; i < 44; i++) {
                ctx.fillStyle = i % 6 === 0 ? '#FFF9C4' : '#ECEFF1';
                ctx.fillRect((i * 57 + bgScroll1 * 0.08) % W, (i * 33) % (GY * 0.85), 2, 2);
            }
        }

        // Clouds
        const cc = scenePhase === 2 ? '#1A237E' : scenePhase === 1 ? '#FFCCBC' : 'rgba(255,255,255,0.82)';
        clouds.forEach(cl => {
            ctx.fillStyle = cc;
            const cx = ((cl.x - bgScroll1 * 0.22) % (W + cl.w + 60)) - 30;
            drawCloud(cx, cl.y, cl.w, cl.h);
        });

        // Buildings
        buildings.forEach(b => {
            const bx = ((b.x - bgScroll2 * 0.52) % (W + b.w + 40)) - 30;
            const by = GY - b.h;
            ctx.fillStyle = sc.bld;
            for (let r = 0; r < b.h; r += 4)
                for (let c = 0; c < b.w; c += 4)
                    ctx.fillRect(bx + c, by + r, 4, 4);
            ctx.fillStyle = sc.win;
            for (let wr = 0; wr < Math.floor(b.h / 14); wr++)
                for (let wc = 0; wc < b.wc; wc++) {
                    const wx = bx + 6 + wc * 12, wy = by + 6 + wr * 14;
                    if ((b.x + wr * 3 + wc) % 3 !== 0 && wx > -8 && wx < W + 8)
                        ctx.fillRect(wx, wy, 8, 8);
                }
        });

        // Ground base
        ctx.fillStyle = sc.gnd;
        ctx.fillRect(0, GY, W, H - GY);
        ctx.fillStyle = sc.gline;
        for (let x = 0; x < W; x += 4) ctx.fillRect(x, GY, 4, 4);
        // Running marks
        for (let i = 0; i < 14; i++) {
            ctx.fillRect(((i * 44 - bgScroll3) % (W + 44)), GY + 10, 14, 4);
        }
    }

    function drawCloud(x, y, w, h) {
        const ps = 4;
        const cols = Math.ceil(w / ps), rows = Math.ceil(h / ps);
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                const nx = c / cols - 0.5, ny = r / rows - 0.5;
                if (nx * nx / 0.24 + ny * ny / 0.18 < 1)
                    ctx.fillRect(x + c * ps, y + r * ps, ps, ps);
            }
    }

    // ============================================
    // OBSTACLES
    // ============================================
    function spawnObs() {
        const vinyl = Math.random() > 0.48;
        if (vinyl) {
            const base = GY - 15 * PS - (Math.random() > 0.55 ? 22 : 0);
            obstacles.push({ type: 'vinyl',   x: W + 10, y: base, baseY: base, w: 15 * PS, h: 15 * PS, ft: Math.random() * Math.PI * 2 });
        } else {
            obstacles.push({ type: 'speaker', x: W + 10, y: GY - 18 * PS,            w: 16 * PS, h: 18 * PS, ft: 0 });
        }
        nextObs = Math.max(55, 110 - Math.floor(score / 200) * 5) + Math.floor(Math.random() * 90);
    }

    // ============================================
    // COLLISION
    // ============================================
    function hit() {
        const mg = PS * 2;
        const px = player.x + mg, py = player.y + mg;
        const pw2 = PW - mg * 2, ph2 = PH - mg * 2;
        for (const o of obstacles) {
            const ox = o.x + mg, oy = o.y + mg;
            const ow = o.w - mg * 2, oh = o.h - mg * 2;
            if (px < ox + ow && px + pw2 > ox && py < oy + oh && py + ph2 > oy) return true;
        }
        return false;
    }

    // ============================================
    // AUDIO  — Lo-fi procedural music
    // ============================================
    let aCtx = null, masterG = null, lofiOn = false, nextMeasure = 0, ci = 0;

    // Cmaj7 · Am7 · Fmaj7 · G7
    const CHORDS = [
        [261.63, 329.63, 392.00, 493.88],
        [220.00, 261.63, 329.63, 392.00],
        [174.61, 220.00, 261.63, 329.63],
        [196.00, 246.94, 293.66, 349.23],
    ];
    const BASS  = [65.41, 55.00, 43.65, 49.00];
    const BPM   = 72;
    const BEAT  = 60 / BPM;
    const MEAS  = BEAT * 4;

    function tone(freq, type, t, dur, vol, dt = 0) {
        if (!aCtx || !masterG) return;
        try {
            const o = aCtx.createOscillator(), g = aCtx.createGain();
            o.type = type; o.frequency.setValueAtTime(freq, t);
            if (dt) o.detune.setValueAtTime(dt, t);
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.018);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g); g.connect(masterG);
            o.start(t); o.stop(t + dur + 0.06);
        } catch(e) {}
    }

    function noise(t, dur, vol, hp = 0) {
        if (!aCtx || !masterG) return;
        try {
            const len = Math.ceil(aCtx.sampleRate * dur);
            const buf = aCtx.createBuffer(1, len, aCtx.sampleRate);
            const d   = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
            const s = aCtx.createBufferSource(), g = aCtx.createGain();
            s.buffer = buf; g.gain.setValueAtTime(vol, t);
            if (hp) { const f = aCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); f.connect(g); }
            else s.connect(g);
            g.connect(masterG); s.start(t);
        } catch(e) {}
    }

    function scheduleMeasure(t) {
        if (!aCtx) return;
        const ch = CHORDS[ci % 4], ba = BASS[ci % 4];
        for (let b = 0; b < 4; b++) {
            const bt = t + b * BEAT, sw = (Math.random() - 0.5) * 0.014;
            // Pads
            ch.forEach((f, i) => tone(f, 'sine', bt + sw, BEAT * 0.88, 0.052 - i * 0.01, (Math.random() - 0.5) * 7));
            // Bass + kick
            if (b === 0 || b === 2) {
                tone(ba, 'triangle', bt, BEAT * 1.4, 0.2);
                try {
                    const ko = aCtx.createOscillator(), kg = aCtx.createGain();
                    ko.frequency.setValueAtTime(130, bt);
                    ko.frequency.exponentialRampToValueAtTime(34, bt + 0.18);
                    kg.gain.setValueAtTime(0.48, bt); kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.3);
                    ko.connect(kg); kg.connect(masterG); ko.start(bt); ko.stop(bt + 0.35);
                } catch(e) {}
            }
            // Snare
            if (b === 1 || b === 3) noise(bt + sw, 0.14, 0.16, 900);
            // Hi-hats
            noise(bt, 0.035, 0.065, 11000);
            noise(bt + BEAT * 0.5, 0.025, 0.04, 11000);
        }
        ci++;
    }

    function scheduleAhead() {
        if (!lofiOn || !aCtx) return;
        while (nextMeasure < aCtx.currentTime + 0.65) {
            scheduleMeasure(nextMeasure);
            nextMeasure += MEAS;
        }
        setTimeout(scheduleAhead, 220);
    }

    function startLofi() {
        if (!aCtx || lofiOn) return;
        lofiOn = true;
        nextMeasure = aCtx.currentTime + 0.05;
        // Vinyl crackle
        try {
            const blen = aCtx.sampleRate * 3, nbuf = aCtx.createBuffer(1, blen, aCtx.sampleRate);
            const nd   = nbuf.getChannelData(0);
            for (let i = 0; i < blen; i++) nd[i] = (Math.random() * 2 - 1) * 0.012;
            const cr = aCtx.createBufferSource(), cf = aCtx.createBiquadFilter(), cg = aCtx.createGain();
            cr.buffer = nbuf; cr.loop = true;
            cf.type = 'bandpass'; cf.frequency.value = 2800; cf.Q.value = 0.35;
            cg.gain.value = 0.035;
            cr.connect(cf); cf.connect(cg); cg.connect(masterG); cr.start();
        } catch(e) {}
        scheduleAhead();
    }

    function initAudio() {
        try {
            aCtx    = new (window.AudioContext || window.webkitAudioContext)();
            masterG = aCtx.createGain();
            masterG.gain.setValueAtTime(muted ? 0 : 0.26, aCtx.currentTime);
            const lp = aCtx.createBiquadFilter();
            lp.type  = 'lowpass'; lp.frequency.setValueAtTime(4200, aCtx.currentTime); lp.Q.value = 0.4;
            masterG.connect(lp); lp.connect(aCtx.destination);
            startLofi();
        } catch(e) {}
    }

    function stopAudio() {
        lofiOn = false;
        if (!aCtx) return;
        try { masterG.gain.linearRampToValueAtTime(0, aCtx.currentTime + 0.4); } catch(e) {}
        setTimeout(() => { try { aCtx.close(); } catch(e) {} aCtx = null; masterG = null; }, 500);
    }

    function sfxJump() {
        if (!aCtx) return;
        try {
            const o = aCtx.createOscillator(), g = aCtx.createGain();
            o.type = 'square';
            o.frequency.setValueAtTime(200, aCtx.currentTime);
            o.frequency.linearRampToValueAtTime(440, aCtx.currentTime + 0.09);
            o.frequency.linearRampToValueAtTime(300, aCtx.currentTime + 0.16);
            g.gain.setValueAtTime(0.14, aCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, aCtx.currentTime + 0.2);
            o.connect(g); g.connect(aCtx.destination);
            o.start(); o.stop(aCtx.currentTime + 0.22);
        } catch(e) {}
    }

    function sfxDie() {
        if (!aCtx) return;
        [380, 290, 200, 140].forEach((f, i) => tone(f, 'square', aCtx.currentTime + i * 0.09, 0.11, 0.18));
    }

    // ============================================
    // GAME LOOP
    // ============================================
    function update() {
        tick++;
        speed = BS + Math.min(Math.floor(score / 300) * 0.38, 3.8);

        bgScroll1 += speed * 0.14;
        bgScroll2 += speed * 0.44;
        bgScroll3 += speed;

        sceneTimer++;
        if (sceneTimer > 60 * 26) { sceneTimer = 0; scenePhase = (scenePhase + 1) % 4; }

        // Physics
        if (!player.onGround) {
            player.vy += GV;
            player.y  += player.vy;
            if (player.y >= GY - PH) { player.y = GY - PH; player.vy = 0; player.onGround = true; }
        }
        if (player.onGround) {
            player.animTick++;
            if (player.animTick >= 9) { player.animTick = 0; player.animFrame ^= 1; }
        }

        // Obstacles
        nextObs--;
        if (nextObs <= 0) spawnObs();
        obstacles.forEach(o => {
            o.x -= speed;
            if (o.type === 'vinyl') { o.ft += 0.055; o.y = o.baseY + Math.sin(o.ft) * 18; }
        });
        obstacles = obstacles.filter(o => o.x > -130);

        score++;
        if (hit()) {
            state = 'dead';
            if (score > hiScore) { hiScore = score; try { localStorage.setItem('rr_hi', hiScore); } catch(e) {} }
            sfxDie();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        drawBackground();

        // Obstacles
        obstacles.forEach(o => drawSprite(o.type === 'vinyl' ? SPR_VINYL : SPR_SPEAKER, o.x, o.y, PS));

        // Player
        let sp = SPR_RUN0;
        if (state === 'dead')         sp = SPR_DEAD;
        else if (!player.onGround)    sp = SPR_JUMP;
        else if (player.animFrame)    sp = SPR_RUN1;
        drawSprite(sp, player.x, player.y, PS);

        // HUD
        const night = scenePhase === 2;
        ctx.imageSmoothingEnabled = false;
        ctx.font = 'bold 14px "Share Tech Mono",monospace';
        ctx.fillStyle = night ? '#CFD8DC' : '#212121';
        ctx.textAlign = 'left';  ctx.fillText(`SCORE: ${score}`, 10, 18);
        ctx.textAlign = 'right'; ctx.fillText(`REC: ${hiScore}`, W - 8, 18);
        ctx.textAlign = 'center';
        ctx.font = '11px "Share Tech Mono",monospace';
        ctx.fillStyle = night ? '#78909C' : '#546E7A';
        ctx.fillText(`NVL ${Math.floor(score / 300) + 1}  ·  ${SCENES[scenePhase].name.toUpperCase()}`, W / 2, 18);
        ctx.textAlign = 'left';

        if (state === 'idle') drawIdle();
        if (state === 'dead') drawOver();
    }

    function drawIdle() {
        ctx.fillStyle = 'rgba(0,0,0,0.54)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDD835';
        ctx.font = 'bold 24px "Share Tech Mono",monospace';
        ctx.fillText('RADIO RUNNER', W / 2, H / 2 - 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '13px "Share Tech Mono",monospace';
        ctx.fillText('ESPACIO / TOCAR PARA JUGAR', W / 2, H / 2 + 4);
        if (hiScore > 0) {
            ctx.fillStyle = '#90CAF9';
            ctx.font = '12px "Share Tech Mono",monospace';
            ctx.fillText(`MEJOR: ${hiScore}`, W / 2, H / 2 + 28);
        }
        ctx.fillStyle = '#37474F';
        ctx.font = '9px monospace';
        ctx.fillText('nmftSTUDIO', W / 2, H - 6);
        ctx.textAlign = 'left';
    }

    function drawOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 24px "Share Tech Mono",monospace';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 32);
        ctx.fillStyle = '#ECEFF1';
        ctx.font = '15px "Share Tech Mono",monospace';
        ctx.fillText(`PUNTUACIÓN: ${score}`, W / 2, H / 2 + 2);
        if (score > 0 && score >= hiScore) {
            ctx.fillStyle = '#FDD835';
            ctx.font = '13px "Share Tech Mono",monospace';
            ctx.fillText('🏆  NUEVO RÉCORD!', W / 2, H / 2 + 26);
        }
        ctx.fillStyle = '#90A4AE';
        ctx.font = '12px "Share Tech Mono",monospace';
        ctx.fillText('TOCAR PARA REINICIAR', W / 2, H / 2 + 52);
        ctx.textAlign = 'left';
    }

    function loop() {
        if (state === 'playing') update();
        draw();
        raf = requestAnimationFrame(loop);
    }

    // ============================================
    // INPUT
    // ============================================
    function jump() {
        if (state === 'idle') { start(); return; }
        if (state === 'dead') { restart(); return; }
        if (player.onGround) { player.vy = JF; player.onGround = false; sfxJump(); }
    }

    function onKey(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    }

    // CORRECCIÓN: Se guardan referencias a los handlers de touch/mouse
    // para poder removerlos exactamente en destroy() y evitar acumulación
    // de listeners al abrir/cerrar el modal varias veces.
    let _onTouch = null;
    let _onMouse = null;

    // ============================================
    // MUTE
    // ============================================
    let muted = false;

    function toggleMute() {
        muted = !muted;
        if (!masterG || !aCtx) return;
        try {
            masterG.gain.cancelScheduledValues(aCtx.currentTime);
            masterG.gain.linearRampToValueAtTime(
                muted ? 0 : 0.26,
                aCtx.currentTime + 0.15
            );
        } catch(e) {}
    }

    function isMuted() { return muted; }

    // ============================================
    // MANAGEMENT
    // ============================================
    function start() {
        state = 'playing'; score = 0; speed = BS; tick = 0;
        obstacles = []; nextObs = 90;
        bgScroll1 = bgScroll2 = bgScroll3 = 0;
        sceneTimer = 0;
        player.x = 70; player.y = GY - PH; player.vy = 0;
        player.onGround = true; player.animFrame = 0; player.animTick = 0;
        if (!aCtx) initAudio();
        else if (masterG) { try { masterG.gain.setValueAtTime(muted ? 0 : 0.26, aCtx.currentTime); } catch(e) {} }
    }

    function restart() {
        start();
    }

    // ============================================
    // PUBLIC
    // ============================================
    function init(el) {
        canvas = el; ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        try { hiScore = parseInt(localStorage.getItem('rr_hi') || '0') || 0; } catch(e) {}
        initScenery();

        // Guardar referencias para poder removerlas en destroy()
        _onTouch = (e) => { e.preventDefault(); jump(); };
        _onMouse = jump;

        window.addEventListener('keydown', onKey);
        canvas.addEventListener('touchstart', _onTouch, { passive: false });
        canvas.addEventListener('mousedown', _onMouse);

        raf = requestAnimationFrame(loop);
        initAudio();
    }

    function destroy() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }

        window.removeEventListener('keydown', onKey);

        // CORRECCIÓN: remover los mismos handlers que se agregaron en init()
        if (_onTouch) { canvas.removeEventListener('touchstart', _onTouch); _onTouch = null; }
        if (_onMouse) { canvas.removeEventListener('mousedown', _onMouse);  _onMouse = null; }

        stopAudio();
        lofiOn = false;
        state  = 'idle';
    }

    return { init, destroy, toggleMute, isMuted };

})();
