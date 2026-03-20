// Moon animation for the Róisín tab
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-animation');
    if (!startBtn) return;

    startBtn.addEventListener('click', startMoonAnimation);
});

function startMoonAnimation() {
    const intro = document.getElementById('roisin-intro');
    const wrapper = document.getElementById('animation-wrapper');
    const canvas = document.getElementById('moon-canvas');
    const revealText = document.getElementById('reveal-text');
    const body = document.body;

    // Hide intro, show canvas
    intro.style.display = 'none';
    wrapper.classList.add('active');

    // Set canvas size
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;

    // Animation state
    const state = {
        phase: 'launch',    // launch -> flyToMoon -> land -> flyBack -> burst -> reveal
        progress: 0,        // 0 to 1 within each phase
        stars: generateStars(200, W, H),
        colorTransition: 0  // 0 = clean, 1 = fully colorful
    };

    // Couple (represented as a small rocket/dot for now)
    const couple = {
        x: W / 2,
        y: H - 100
    };

    // Moon position
    const moon = {
        x: W / 2,
        y: 120,
        radius: 50
    };

    // Earth position
    const earth = {
        x: W / 2,
        y: H - 60,
        radius: 800 // large, only top visible
    };

    // Phase durations in ms
    const phaseDurations = {
        launch: 2000,
        flyToMoon: 3000,
        land: 1500,
        flyBack: 3000,
        burst: 1500,
        reveal: 2000
    };

    let phaseStart = performance.now();

    // Transition to dark as animation starts
    body.classList.add('roisin-phase-2');

    function animate(timestamp) {
        const elapsed = timestamp - phaseStart;
        const duration = phaseDurations[state.phase];
        state.progress = Math.min(elapsed / duration, 1);

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Background gradient based on phase
        drawBackground(ctx, W, H, state);

        // Stars
        drawStars(ctx, state.stars, state);

        // Earth (bottom)
        drawEarth(ctx, earth, W, H, state);

        // Moon (top)
        drawMoon(ctx, moon, state);

        // Couple / rocket
        updateCouplePosition(couple, state, W, H, moon, earth);
        drawCouple(ctx, couple, state);

        // Trail particles
        if (state.phase === 'flyToMoon' || state.phase === 'flyBack') {
            drawTrail(ctx, couple, state);
        }

        // Phase transitions
        if (state.progress >= 1) {
            advancePhase(state, body, revealText);
            phaseStart = timestamp;
        }

        if (state.phase !== 'done') {
            requestAnimationFrame(animate);
        }
    }

    // Delay slightly then start
    setTimeout(() => {
        body.classList.remove('roisin-phase-2');
        body.classList.add('roisin-phase-3');
        requestAnimationFrame(animate);
    }, 800);
}

function generateStars(count, W, H) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01
        });
    }
    return stars;
}

function drawBackground(ctx, W, H, state) {
    let topColor, bottomColor;

    if (state.phase === 'burst') {
        const p = state.progress;
        if (p < 0.3) {
            // Flash white
            const intensity = Math.floor(255 * (1 - p / 0.3));
            topColor = `rgb(${intensity}, ${intensity}, ${Math.min(255, intensity + 30)})`;
            bottomColor = topColor;
        } else {
            topColor = '#0d0d2a';
            bottomColor = '#1a1a3e';
        }
    } else {
        topColor = '#0d0d2a';
        bottomColor = '#1a1a3e';
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
}

function drawStars(ctx, stars, state) {
    const time = performance.now() / 1000;
    stars.forEach(star => {
        const alpha = 0.4 + 0.6 * Math.sin(time * star.speed * 50 + star.twinkle);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    });
}

function drawMoon(ctx, moon, state) {
    // Glow
    const glow = ctx.createRadialGradient(
        moon.x, moon.y, moon.radius * 0.8,
        moon.x, moon.y, moon.radius * 2
    );
    glow.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
    glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(moon.x - moon.radius * 2, moon.y - moon.radius * 2, moon.radius * 4, moon.radius * 4);

    // Moon body
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    const moonGrad = ctx.createRadialGradient(
        moon.x - 10, moon.y - 10, 5,
        moon.x, moon.y, moon.radius
    );
    moonGrad.addColorStop(0, '#fffde8');
    moonGrad.addColorStop(1, '#e8e0c0');
    ctx.fillStyle = moonGrad;
    ctx.fill();

    // Craters
    const craters = [
        { x: moon.x - 15, y: moon.y - 10, r: 8 },
        { x: moon.x + 12, y: moon.y + 5, r: 6 },
        { x: moon.x - 5, y: moon.y + 15, r: 10 },
        { x: moon.x + 18, y: moon.y - 15, r: 5 }
    ];
    craters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 190, 160, 0.4)';
        ctx.fill();
    });
}

function drawEarth(ctx, earth, W, H, state) {
    const earthY = H + earth.radius - 60;

    // Atmosphere glow
    const atmosGrad = ctx.createRadialGradient(
        earth.x, earthY, earth.radius * 0.95,
        earth.x, earthY, earth.radius * 1.05
    );
    atmosGrad.addColorStop(0, 'rgba(100, 180, 255, 0.1)');
    atmosGrad.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(earth.x, earthY, earth.radius * 1.05, 0, Math.PI * 2);
    ctx.fill();

    // Earth body
    ctx.beginPath();
    ctx.arc(earth.x, earthY, earth.radius, 0, Math.PI * 2);
    const earthGrad = ctx.createRadialGradient(
        earth.x - 100, earthY - 100, 50,
        earth.x, earthY, earth.radius
    );
    earthGrad.addColorStop(0, '#4a9eff');
    earthGrad.addColorStop(0.4, '#2d7dd2');
    earthGrad.addColorStop(0.7, '#1a5e9a');
    earthGrad.addColorStop(1, '#0d3b66');
    ctx.fillStyle = earthGrad;
    ctx.fill();

    // Land masses (simple shapes)
    ctx.fillStyle = 'rgba(80, 160, 80, 0.3)';
    ctx.beginPath();
    ctx.ellipse(earth.x - 80, earthY - earth.radius + 30, 60, 25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(earth.x + 100, earthY - earth.radius + 50, 40, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
}

function updateCouplePosition(couple, state, W, H, moon, earth) {
    const ease = easeInOutCubic(state.progress);

    switch (state.phase) {
        case 'launch':
            couple.x = W / 2;
            couple.y = H - 100 - ease * 50;
            break;
        case 'flyToMoon':
            couple.x = W / 2 + Math.sin(state.progress * Math.PI * 2) * 30;
            couple.y = (H - 150) - ease * (H - 150 - moon.y - moon.radius - 20);
            break;
        case 'land':
            couple.x = W / 2;
            couple.y = moon.y + moon.radius + 20 - ease * 5;
            break;
        case 'flyBack':
            couple.x = W / 2 + Math.sin(state.progress * Math.PI * 3) * 40;
            couple.y = (moon.y + moon.radius + 15) + ease * (H - 150 - moon.y - moon.radius - 15);
            break;
        case 'burst':
        case 'reveal':
            couple.x = W / 2;
            couple.y = H - 100;
            break;
    }
}

function drawCouple(ctx, couple, state) {
    if (state.phase === 'reveal' || state.phase === 'done') return;

    // Small glowing dot representing the couple
    const glow = ctx.createRadialGradient(
        couple.x, couple.y, 2,
        couple.x, couple.y, 20
    );

    // Color shifts from white to warm as animation progresses
    const phases = ['launch', 'flyToMoon', 'land', 'flyBack', 'burst'];
    const phaseIndex = phases.indexOf(state.phase);
    const warmth = phaseIndex / phases.length;

    const r = Math.floor(255);
    const g = Math.floor(255 - warmth * 55);
    const b = Math.floor(255 - warmth * 155);

    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    glow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
    glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(couple.x, couple.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(couple.x, couple.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawTrail(ctx, couple, state) {
    const count = 15;
    const direction = state.phase === 'flyToMoon' ? 1 : -1;

    for (let i = 0; i < count; i++) {
        const age = i / count;
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = direction * i * 8 + (Math.random() - 0.5) * 3;
        const alpha = (1 - age) * 0.5;
        const size = (1 - age) * 3;

        ctx.beginPath();
        ctx.arc(couple.x + offsetX, couple.y + offsetY, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.fill();
    }
}

function advancePhase(state, body, revealText) {
    const order = ['launch', 'flyToMoon', 'land', 'flyBack', 'burst', 'reveal', 'done'];
    const currentIndex = order.indexOf(state.phase);

    if (currentIndex < order.length - 1) {
        state.phase = order[currentIndex + 1];
        state.progress = 0;

        if (state.phase === 'burst') {
            body.classList.add('roisin-burst');
        }

        if (state.phase === 'reveal') {
            revealText.classList.add('visible');
        }
    }
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
