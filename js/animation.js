// Moon animation for the Róisín tab
// Sequence: launch -> flyToMoon -> orbitMoon -> flyBack -> land -> stickFigures -> photoBurst -> moonTransform -> reveal

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-animation');
    if (!startBtn) return;
    startBtn.addEventListener('click', startMoonAnimation);
});

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

async function startMoonAnimation() {
    const intro = document.getElementById('roisin-intro');
    const wrapper = document.getElementById('animation-wrapper');
    const canvas = document.getElementById('moon-canvas');
    const revealText = document.getElementById('reveal-text');
    const body = document.body;

    const [profileImg, moonPhotoImg, ...kissingImgs] = await Promise.all([
        loadImage('assets/images/mikael.jpg'),
        loadImage('assets/images/moon-photo.jpg'),
        loadImage('assets/images/kiss1.jpg'),
        loadImage('assets/images/kiss2.jpg'),
        loadImage('assets/images/kiss3.jpg'),
        loadImage('assets/images/kiss4.jpg'),
        loadImage('assets/images/kiss5.jpg'),
        loadImage('assets/images/kiss6.jpg'),
    ]);
    const validKissingImgs = kissingImgs.filter(img => img !== null);

    intro.style.display = 'none';
    wrapper.classList.add('active');

    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Positions — earth is prominent, showing a good arc of curvature
    const earthRadius = 400;
    const earthX = W / 2;
    const earthSurfaceY = H - 120;
    const earthCenterY = earthSurfaceY + earthRadius;

    const moon = { x: W / 2, y: 110, radius: 45 };

    const state = {
        phase: 'launch',
        progress: 0,
        stars: generateStars(250, W, H),
        moonTransition: 0,
        burstPhotos: [],
        burstTriggered: false,
        // Rocket
        rocketX: W / 2,
        rocketY: earthSurfaceY - 30,
        rocketAngle: 0,
        // Stick figures
        stickProgress: 0,
        kissStarted: false,
        // Orbit tracking
        orbitAngle: 0,
    };

    const phaseDurations = {
        launch: 1500,
        flyToMoon: 3000,
        orbitMoon: 3000,
        flyBack: 3000,
        land: 1500,
        stickFigures: 4000,
        photoBurst: 2500,
        moonTransform: 2000,
        reveal: 3000
    };

    let phaseStart = performance.now();
    body.classList.add('roisin-phase-2');

    function animate(timestamp) {
        const elapsed = timestamp - phaseStart;
        const duration = phaseDurations[state.phase];
        state.progress = Math.min(elapsed / duration, 1);

        ctx.clearRect(0, 0, W, H);
        drawBackground(ctx, W, H, state);
        drawStars(ctx, state.stars);

        // Draw moon (with optional photo transition)
        drawMoon(ctx, moon, state, moonPhotoImg);

        // Draw earth (prominent)
        drawEarth(ctx, earthX, earthCenterY, earthRadius, W, H);

        // Update rocket position
        updateRocket(state, W, H, moon, earthSurfaceY);

        // Draw rocket with profile photo
        if (state.phase !== 'stickFigures' && state.phase !== 'photoBurst' &&
            state.phase !== 'moonTransform' && state.phase !== 'reveal') {
            drawRocket(ctx, state, profileImg);
        }

        // Draw trail
        if (state.phase === 'flyToMoon' || state.phase === 'flyBack' || state.phase === 'launch') {
            drawRocketTrail(ctx, state);
        }

        // Stick figures phase
        if (state.phase === 'stickFigures' || state.phase === 'photoBurst' ||
            state.phase === 'moonTransform' || state.phase === 'reveal') {
            // Draw landed rocket
            drawLandedRocket(ctx, earthSurfaceY, W);
            drawStickFigures(ctx, state, earthSurfaceY, W);
        }

        // Photo burst
        if (state.phase === 'photoBurst' && !state.burstTriggered && validKissingImgs.length > 0) {
            state.burstTriggered = true;
            state.burstPhotos = createBurstPhotos(validKissingImgs, W, H, earthSurfaceY);
        }
        if (state.burstPhotos.length > 0) {
            updateAndDrawBurstPhotos(ctx, state.burstPhotos, state);
        }

        // Moon transform
        if (state.phase === 'moonTransform') {
            state.moonTransition = easeInOutCubic(state.progress);
        }

        if (state.progress >= 1) {
            advancePhase(state, body, revealText);
            phaseStart = timestamp;
        }

        if (state.phase !== 'done') {
            requestAnimationFrame(animate);
        }
    }

    setTimeout(() => {
        body.classList.remove('roisin-phase-2');
        body.classList.add('roisin-phase-3');
        requestAnimationFrame(animate);
    }, 800);
}

// === STARS ===
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

function drawStars(ctx, stars) {
    const time = performance.now() / 1000;
    stars.forEach(star => {
        const alpha = 0.4 + 0.6 * Math.sin(time * star.speed * 50 + star.twinkle);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    });
}

// === BACKGROUND ===
function drawBackground(ctx, W, H, state) {
    let topColor = '#0d0d2a';
    let bottomColor = '#1a1a3e';

    if (state.phase === 'photoBurst') {
        const p = state.progress;
        if (p < 0.2) {
            const intensity = Math.floor(255 * (1 - p / 0.2));
            topColor = `rgb(${intensity}, ${intensity}, ${Math.min(255, intensity + 30)})`;
            bottomColor = topColor;
        }
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
}

// === MOON ===
function drawMoon(ctx, moon, state, moonPhotoImg) {
    const t = state.moonTransition;

    // Glow
    const glowAlpha = 0.15 * (1 - t * 0.3);
    const glow = ctx.createRadialGradient(
        moon.x, moon.y, moon.radius * 0.8,
        moon.x, moon.y, moon.radius * 2.5
    );
    glow.addColorStop(0, `rgba(255, 255, 200, ${glowAlpha})`);
    glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon body (fades out)
    if (t < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - t;
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
        [{ x: -15, y: -10, r: 7 }, { x: 12, y: 5, r: 5 },
         { x: -5, y: 15, r: 9 }, { x: 18, y: -15, r: 4 }].forEach(c => {
            ctx.beginPath();
            ctx.arc(moon.x + c.x, moon.y + c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 190, 160, 0.4)';
            ctx.fill();
        });
        ctx.restore();
    }

    // Couple photo (fades in)
    if (t > 0 && moonPhotoImg) {
        ctx.save();
        ctx.globalAlpha = t;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
        ctx.clip();
        const size = moon.radius * 2;
        ctx.drawImage(moonPhotoImg, moon.x - moon.radius, moon.y - moon.radius, size, size);
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${t * 0.7})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// === EARTH (prominent) ===
function drawEarth(ctx, earthX, earthCenterY, earthRadius, W, H) {
    // Atmosphere glow
    const atmosGrad = ctx.createRadialGradient(
        earthX, earthCenterY, earthRadius * 0.97,
        earthX, earthCenterY, earthRadius * 1.08
    );
    atmosGrad.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
    atmosGrad.addColorStop(0.5, 'rgba(100, 200, 255, 0.08)');
    atmosGrad.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(earthX, earthCenterY, earthRadius * 1.08, 0, Math.PI * 2);
    ctx.fill();

    // Earth body
    ctx.beginPath();
    ctx.arc(earthX, earthCenterY, earthRadius, 0, Math.PI * 2);
    const earthGrad = ctx.createRadialGradient(
        earthX - 60, earthCenterY - earthRadius, 30,
        earthX, earthCenterY, earthRadius
    );
    earthGrad.addColorStop(0, '#5cb8ff');
    earthGrad.addColorStop(0.3, '#3a9de0');
    earthGrad.addColorStop(0.6, '#2278b5');
    earthGrad.addColorStop(1, '#0d4a7a');
    ctx.fillStyle = earthGrad;
    ctx.fill();

    // Land masses (more detailed)
    ctx.fillStyle = 'rgba(60, 150, 60, 0.4)';
    // Large continent left
    ctx.beginPath();
    ctx.ellipse(earthX - 70, earthCenterY - earthRadius + 20, 55, 30, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Medium continent right
    ctx.beginPath();
    ctx.ellipse(earthX + 80, earthCenterY - earthRadius + 35, 40, 22, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Small island
    ctx.beginPath();
    ctx.ellipse(earthX + 10, earthCenterY - earthRadius + 15, 18, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Cloud wisps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(earthX - 40, earthCenterY - earthRadius + 10, 50, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(earthX + 50, earthCenterY - earthRadius + 25, 35, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
}

// === ROCKET POSITION ===
function updateRocket(state, W, H, moon, earthSurfaceY) {
    const ease = easeInOutCubic(state.progress);
    const startY = earthSurfaceY - 30;

    switch (state.phase) {
        case 'launch':
            state.rocketX = W / 2;
            state.rocketY = startY - ease * 80;
            state.rocketAngle = 0;
            break;

        case 'flyToMoon':
            state.rocketX = W / 2 + Math.sin(state.progress * Math.PI) * 40;
            state.rocketY = (startY - 80) - ease * (startY - 80 - moon.y - moon.radius - 40);
            state.rocketAngle = Math.sin(state.progress * Math.PI) * 0.15;
            break;

        case 'orbitMoon': {
            // Orbit around the moon
            const orbitRadius = moon.radius + 35;
            // Start from top (arriving), go around counter-clockwise
            const startAngle = Math.PI / 2; // bottom of moon (arriving from below)
            const endAngle = startAngle + Math.PI * 2; // full orbit
            const angle = startAngle + ease * (endAngle - startAngle);

            state.rocketX = moon.x + Math.cos(angle) * orbitRadius;
            state.rocketY = moon.y + Math.sin(angle) * orbitRadius;
            // Rocket points tangent to orbit
            state.rocketAngle = angle + Math.PI / 2;
            state.orbitAngle = angle;
            break;
        }

        case 'flyBack': {
            const orbitEndX = moon.x;
            const orbitEndY = moon.y + moon.radius + 35;
            state.rocketX = orbitEndX + (W / 2 - orbitEndX) * ease + Math.sin(state.progress * Math.PI * 2) * 30;
            state.rocketY = orbitEndY + (startY - orbitEndY) * ease;
            state.rocketAngle = Math.PI + Math.sin(state.progress * Math.PI) * 0.15;
            break;
        }

        case 'land':
            state.rocketX = W / 2;
            state.rocketY = startY + ease * 5;
            state.rocketAngle = Math.PI;
            break;
    }
}

// === DRAW ROCKET ===
function drawRocket(ctx, state, profileImg) {
    const x = state.rocketX;
    const y = state.rocketY;
    const angle = state.rocketAngle;
    const rocketH = 40;
    const rocketW = 18;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Flame
    if (state.phase === 'launch' || state.phase === 'flyToMoon' || state.phase === 'flyBack') {
        const flicker = Math.random() * 5;
        // Outer flame
        ctx.beginPath();
        ctx.moveTo(-6, rocketH / 2);
        ctx.quadraticCurveTo(0, rocketH / 2 + 20 + flicker, 6, rocketH / 2);
        ctx.fillStyle = 'rgba(255, 100, 20, 0.8)';
        ctx.fill();
        // Inner flame
        ctx.beginPath();
        ctx.moveTo(-3, rocketH / 2);
        ctx.quadraticCurveTo(0, rocketH / 2 + 12 + flicker * 0.5, 3, rocketH / 2);
        ctx.fillStyle = 'rgba(255, 220, 80, 0.9)';
        ctx.fill();
    }

    // Rocket body
    ctx.beginPath();
    ctx.moveTo(0, -rocketH / 2 - 8); // nose cone tip
    ctx.quadraticCurveTo(rocketW / 2 + 2, -rocketH / 4, rocketW / 2, rocketH / 4);
    ctx.lineTo(rocketW / 2, rocketH / 2);
    ctx.lineTo(-rocketW / 2, rocketH / 2);
    ctx.lineTo(-rocketW / 2, rocketH / 4);
    ctx.quadraticCurveTo(-rocketW / 2 - 2, -rocketH / 4, 0, -rocketH / 2 - 8);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nose cone color
    ctx.beginPath();
    ctx.moveTo(0, -rocketH / 2 - 8);
    ctx.quadraticCurveTo(rocketW / 2, -rocketH / 4, rocketW / 2 - 2, -rocketH / 6);
    ctx.lineTo(-rocketW / 2 + 2, -rocketH / 6);
    ctx.quadraticCurveTo(-rocketW / 2, -rocketH / 4, 0, -rocketH / 2 - 8);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    // Fins
    ctx.fillStyle = '#e74c3c';
    // Left fin
    ctx.beginPath();
    ctx.moveTo(-rocketW / 2, rocketH / 4);
    ctx.lineTo(-rocketW / 2 - 8, rocketH / 2 + 5);
    ctx.lineTo(-rocketW / 2, rocketH / 2);
    ctx.fill();
    // Right fin
    ctx.beginPath();
    ctx.moveTo(rocketW / 2, rocketH / 4);
    ctx.lineTo(rocketW / 2 + 8, rocketH / 2 + 5);
    ctx.lineTo(rocketW / 2, rocketH / 2);
    ctx.fill();

    // Window with profile photo
    const windowR = 7;
    const windowY = -2;
    if (profileImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, windowY, windowR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(profileImg, -windowR, windowY - windowR, windowR * 2, windowR * 2);
        ctx.restore();
    }
    // Window border
    ctx.beginPath();
    ctx.arc(0, windowY, windowR, 0, Math.PI * 2);
    ctx.strokeStyle = '#99d5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // Glow around rocket
    const glow = ctx.createRadialGradient(x, y, 10, x, y, 40);
    glow.addColorStop(0, 'rgba(255, 220, 150, 0.15)');
    glow.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
}

// === ROCKET TRAIL ===
function drawRocketTrail(ctx, state) {
    const count = 20;
    for (let i = 0; i < count; i++) {
        const age = i / count;
        const offsetX = (Math.random() - 0.5) * 12;
        let offsetY;

        if (state.phase === 'flyToMoon' || state.phase === 'launch') {
            offsetY = i * 6 + (Math.random() - 0.5) * 3;
        } else {
            offsetY = -i * 6 + (Math.random() - 0.5) * 3;
        }

        const alpha = (1 - age) * 0.4;
        const size = (1 - age) * 3;

        ctx.beginPath();
        ctx.arc(state.rocketX + offsetX, state.rocketY + offsetY, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 60, ${alpha})`;
        ctx.fill();
    }
}

// === LANDED ROCKET ===
function drawLandedRocket(ctx, earthSurfaceY, W) {
    const x = W / 2;
    const y = earthSurfaceY - 15;
    const rocketH = 40;
    const rocketW = 18;

    ctx.save();
    ctx.translate(x, y);

    // Rocket body (pointing up, landed)
    ctx.beginPath();
    ctx.moveTo(0, -rocketH / 2 - 8);
    ctx.quadraticCurveTo(rocketW / 2 + 2, -rocketH / 4, rocketW / 2, rocketH / 4);
    ctx.lineTo(rocketW / 2, rocketH / 2);
    ctx.lineTo(-rocketW / 2, rocketH / 2);
    ctx.lineTo(-rocketW / 2, rocketH / 4);
    ctx.quadraticCurveTo(-rocketW / 2 - 2, -rocketH / 4, 0, -rocketH / 2 - 8);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nose cone
    ctx.beginPath();
    ctx.moveTo(0, -rocketH / 2 - 8);
    ctx.quadraticCurveTo(rocketW / 2, -rocketH / 4, rocketW / 2 - 2, -rocketH / 6);
    ctx.lineTo(-rocketW / 2 + 2, -rocketH / 6);
    ctx.quadraticCurveTo(-rocketW / 2, -rocketH / 4, 0, -rocketH / 2 - 8);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    // Fins
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(-rocketW / 2, rocketH / 4);
    ctx.lineTo(-rocketW / 2 - 8, rocketH / 2 + 5);
    ctx.lineTo(-rocketW / 2, rocketH / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rocketW / 2, rocketH / 4);
    ctx.lineTo(rocketW / 2 + 8, rocketH / 2 + 5);
    ctx.lineTo(rocketW / 2, rocketH / 2);
    ctx.fill();

    // Window
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#99d5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(150, 210, 255, 0.3)';
    ctx.fill();

    ctx.restore();
}

// === STICK FIGURES ===
function drawStickFigures(ctx, state, earthSurfaceY, W) {
    const groundY = earthSurfaceY;
    const rocketX = W / 2;

    let mikealProgress, roisinProgress, kissProgress;

    if (state.phase === 'stickFigures') {
        // First 40%: Mikael walks out of the rocket to the right
        mikealProgress = Math.min(state.progress / 0.4, 1);
        // 20%-60%: Róisín enters from the right side of screen
        roisinProgress = Math.max(0, Math.min((state.progress - 0.2) / 0.4, 1));
        // 60%-100%: They walk toward each other and kiss
        kissProgress = Math.max(0, Math.min((state.progress - 0.6) / 0.4, 1));
    } else {
        mikealProgress = 1;
        roisinProgress = 1;
        kissProgress = 1;
    }

    const mikealEase = easeInOutCubic(mikealProgress);
    const roisinEase = easeInOutCubic(roisinProgress);
    const kissEase = easeInOutCubic(kissProgress);

    // Mikael walks out from rocket to the right
    const mikealWalkDist = 60;
    const mikealBaseX = rocketX + mikealWalkDist * mikealEase;

    // Róisín enters from off-screen right, walks left
    const roisinStartX = W + 20; // off-screen right
    const roisinTargetX = rocketX + mikealWalkDist + 40; // stops near Mikael's area
    const roisinBaseX = roisinStartX - (roisinStartX - roisinTargetX) * roisinEase;

    // Move toward each other for kiss
    const kissGap = 8;
    const meetPointX = (mikealBaseX + roisinBaseX) / 2;
    const mikealX = mikealBaseX + (meetPointX - mikealBaseX + kissGap / 2) * kissEase;
    const roisinX = roisinBaseX - (roisinBaseX - meetPointX - kissGap / 2) * kissEase;

    // Walking bob
    const mikealBob = mikealProgress < 1 ? Math.sin(mikealProgress * Math.PI * 6) * 2 : 0;
    const roisinBob = roisinProgress < 1 ? Math.sin(roisinProgress * Math.PI * 6) * 2 : 0;

    // Draw Mikael (right side, slightly taller)
    if (mikealProgress > 0) {
        drawStickPerson(ctx, mikealX, groundY + mikealBob, 22, '#4fc3f7', false, kissProgress > 0.8);
    }

    // Draw Róisín (left side, slightly shorter, with hair detail)
    if (roisinProgress > 0) {
        drawStickPerson(ctx, roisinX, groundY + roisinBob, 19, '#f48fb1', true, kissProgress > 0.8);
    }

    // Heart when kissing
    if (kissProgress > 0.8) {
        const heartX = (mikealX + roisinX) / 2;
        const heartY = groundY - 35;
        const heartScale = Math.min((kissProgress - 0.8) / 0.2, 1);
        drawHeart(ctx, heartX, heartY - 10 * heartScale, 6 * heartScale, heartScale);
    }
}

function drawStickPerson(ctx, x, groundY, height, color, isRoisin, isKissing) {
    const headR = 5;
    const bodyLen = height * 0.45;
    const legLen = height * 0.35;
    const armLen = height * 0.3;

    const headY = groundY - height + headR;
    const shoulderY = headY + headR + 2;
    const hipY = shoulderY + bodyLen;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(x, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Hair for Róisín
    if (isRoisin) {
        ctx.beginPath();
        ctx.arc(x, headY - 1, headR + 1.5, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Longer hair strands
        ctx.beginPath();
        ctx.moveTo(x - headR - 1, headY);
        ctx.quadraticCurveTo(x - headR - 3, headY + 8, x - headR + 1, headY + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + headR + 1, headY);
        ctx.quadraticCurveTo(x + headR + 3, headY + 8, x + headR - 1, headY + 12);
        ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Body
    ctx.beginPath();
    ctx.moveTo(x, shoulderY);
    ctx.lineTo(x, hipY);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x - 5, hipY + legLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x + 5, hipY + legLen);
    ctx.stroke();

    // Arms
    if (isKissing) {
        // Arms reaching toward partner
        const dir = isRoisin ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY + 3);
        ctx.lineTo(x + dir * armLen * 0.8, shoulderY + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, shoulderY + 6);
        ctx.lineTo(x + dir * armLen * 0.6, shoulderY + 10);
        ctx.stroke();
    } else {
        // Normal arms
        ctx.beginPath();
        ctx.moveTo(x, shoulderY + 3);
        ctx.lineTo(x - armLen * 0.7, shoulderY + armLen * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, shoulderY + 3);
        ctx.lineTo(x + armLen * 0.7, shoulderY + armLen * 0.5);
        ctx.stroke();
    }
}

function drawHeart(ctx, x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
    ctx.restore();
}

// === KISSING PHOTO BURST ===
function createBurstPhotos(images, W, H, earthSurfaceY) {
    const photos = [];
    images.forEach((img, i) => {
        const angle = -Math.PI * 0.2 - (Math.PI * 0.6 / (images.length - 1 || 1)) * i;
        const speed = 3 + Math.random() * 2;
        const size = 55 + Math.random() * 25;

        photos.push({
            img: img,
            x: W / 2,
            y: earthSurfaceY - 10,
            vx: Math.cos(angle) * speed * 3,
            vy: Math.sin(angle) * speed * 2 - 2,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            size: size,
            opacity: 0,
            finalX: (W / (images.length + 1)) * (i + 1),
            finalY: H * 0.25 + Math.random() * H * 0.25,
            finalRotation: (Math.random() - 0.5) * 0.25,
            settleProgress: 0
        });
    });
    return photos;
}

function updateAndDrawBurstPhotos(ctx, photos, state) {
    const settling = state.phase === 'moonTransform' || state.phase === 'reveal';

    photos.forEach(photo => {
        if (!settling) {
            photo.vy += 0.06;
            photo.x += photo.vx;
            photo.y += photo.vy;
            photo.rotation += photo.rotSpeed;
            photo.opacity = Math.min(photo.opacity + 0.06, 1);
            photo.vx *= 0.985;
        } else {
            photo.x += (photo.finalX - photo.x) * 0.06;
            photo.y += (photo.finalY - photo.y) * 0.06;
            photo.rotation += (photo.finalRotation - photo.rotation) * 0.06;
            photo.opacity = 1;
        }

        ctx.save();
        ctx.globalAlpha = photo.opacity;
        ctx.translate(photo.x, photo.y);
        ctx.rotate(photo.rotation);

        const half = photo.size / 2;
        const border = 4;

        // Polaroid frame
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        roundRect(ctx, -half - border, -half - border, photo.size + border * 2, photo.size + border * 2, 4);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Photo
        ctx.beginPath();
        roundRect(ctx, -half, -half, photo.size, photo.size, 2);
        ctx.clip();
        ctx.drawImage(photo.img, -half, -half, photo.size, photo.size);

        ctx.restore();
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// === PHASE MANAGEMENT ===
function advancePhase(state, body, revealText) {
    const order = ['launch', 'flyToMoon', 'orbitMoon', 'flyBack', 'land',
                   'stickFigures', 'photoBurst', 'moonTransform', 'reveal', 'done'];
    const currentIndex = order.indexOf(state.phase);

    if (currentIndex < order.length - 1) {
        state.phase = order[currentIndex + 1];
        state.progress = 0;

        if (state.phase === 'photoBurst') {
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
