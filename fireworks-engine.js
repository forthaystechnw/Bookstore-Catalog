/**
 * Fireworks Click Overlay — engine only
 * --------------------------------------
 * Loaded dynamically by index.html ONLY when the admin has turned
 * fireworks on (via the toggle in admin.html). The canvas now captures
 * clicks/taps itself (pointer-events: auto) so visitors can't
 * accidentally click products underneath while this is active.
 */
(function () {
  // Subtle dark tint over the whole page so visitors sense something
  // interactive is layered on top. Sits below the canvas.
  const overlay = document.createElement('div');
  overlay.id = 'fireworks-dim-overlay';
  overlay.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
    'background:rgba(0,0,0,0.35);pointer-events:none;z-index:9998;';
  document.body.appendChild(overlay);

  // Small hint badge so visitors know they can click/tap anywhere.
  const hint = document.createElement('div');
  hint.id = 'fireworks-hint';
  hint.textContent = '🎆 Happy 4th of July! Tap or click anywhere';
  hint.style.cssText =
    'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
    'z-index:10000;pointer-events:none;background:rgba(0,0,0,0.6);' +
    'color:#fff;font-family:sans-serif;font-size:13px;font-weight:600;' +
    'padding:8px 16px;border-radius:20px;transition:opacity 1.5s ease;';
  document.body.appendChild(hint);
  // Fade the hint out after a few seconds so it doesn't linger forever.
  setTimeout(() => { hint.style.opacity = '0'; }, 4000);
  setTimeout(() => hint.remove(), 6000);

  const exitBtn = document.createElement('button');
  exitBtn.id = 'fireworks-exit-btn';
  exitBtn.textContent = '✕ Exit Fireworks';
  exitBtn.style.cssText =
    'position:fixed;top:16px;right:16px;z-index:10001;pointer-events:auto;' +
    'background:#fbbe00;color:#1a1a1a;border:none;border-radius:6px;' +
    'padding:8px 14px;font-size:14px;font-weight:600;font-family:sans-serif;' +
    'cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.4);';
  exitBtn.addEventListener('mouseenter', () => (exitBtn.style.background = '#ffd347'));
  exitBtn.addEventListener('mouseleave', () => (exitBtn.style.background = '#fbbe00'));
  document.body.appendChild(exitBtn);

  const canvas = document.createElement('canvas');
  canvas.id = 'fireworks-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
    'pointer-events:auto;z-index:9999;cursor:pointer;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#fbbe00', '#ff5e5e', '#5ec8ff', '#8effa1', '#ff8ef0', '#ffffff'];
  let particles = [];
  let rockets = [];

  // ── Burst sound, synthesized on the fly (no audio file needed) ──
  let audioCtx;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playBurstSound() {
    const ac = getAudioCtx();
    const duration = 0.35;
    const bufferSize = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Decaying white noise = the "crackle" of a firework pop
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = ac.createBufferSource();
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 700 + Math.random() * 800; // varies a bit each time
    filter.Q.value = 0.6;

    const gainNode = ac.createGain();
    gainNode.gain.setValueAtTime(0.3, ac.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ac.destination);
    noise.start();
    noise.stop(ac.currentTime + duration);
  }

  function launchRocket(targetX, targetY) {
    const startX = targetX + (Math.random() * 60 - 30);
    const startY = canvas.height + 10;
    const dist = startY - targetY;
    const speed = 6 + dist * 0.01;

    rockets.push({
      x: startX,
      y: startY,
      targetX,
      targetY,
      vx: (targetX - startX) / (dist / speed),
      vy: -speed,
      trail: [],
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function burst(x, y) {
    playBurstSound();
    const count = 40 + Math.floor(Math.random() * 20);
    const baseColor = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 0.8 + Math.random() * 1.8;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.006 + Math.random() * 0.006,
        color: Math.random() < 0.7 ? baseColor : colors[Math.floor(Math.random() * colors.length)],
        size: 0.8 + Math.random() * 1
      });
    }
  }

  let running = true;

  function animate() {
    if (!running) return;

    const somethingActive = particles.length > 0 || rockets.length > 0;

    if (somethingActive) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.985;
      p.vy = Math.min(p.vy, 2);
      p.life -= p.decay;

      if (p.life > 0) {
        ctx.beginPath();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.life > 0);

    rockets.forEach(r => {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 10) r.trail.shift();

      r.x += r.vx;
      r.y += r.vy;

      r.trail.forEach((t, i) => {
        ctx.beginPath();
        ctx.globalAlpha = (i / r.trail.length) * 0.6;
        ctx.fillStyle = r.color;
        ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.beginPath();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      ctx.fill();

      if (r.y <= r.targetY) {
        burst(r.targetX, r.targetY);
      }
    });

    ctx.globalAlpha = 1;
    rockets = rockets.filter(r => r.y > r.targetY);

    requestAnimationFrame(animate);
  }
  animate();

  function handlePointer(x, y) {
    const ac = getAudioCtx();
    if (ac.state === 'suspended') ac.resume();
    launchRocket(x, y);
  }

  canvas.addEventListener('click', (e) => handlePointer(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => {
    for (const touch of e.changedTouches) {
      handlePointer(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  exitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    running = false;
    particles = [];
    rockets = [];
    overlay.remove();
    hint.remove();
    canvas.remove();
    exitBtn.remove();
  });
})();
