/**
 * Fireworks Click Overlay — engine only
 * --------------------------------------
 * This file is loaded dynamically by index.html ONLY when the admin has
 * turned fireworks on (via the toggle in admin.html). It has no on/off
 * logic of its own and no exit button — visitors can't turn it off.
 */
(function () {
  // Subtle dark tint over the whole page so visitors sense something
  // interactive is layered on top. Sits below the canvas, doesn't block
  // clicks (they pass through to the fireworks listener on document).
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

  const canvas = document.createElement('canvas');
  canvas.id = 'fireworks-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
    'pointer-events:none;z-index:9999;';
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

  function animate() {
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

  document.addEventListener('click', (e) => launchRocket(e.clientX, e.clientY));
  document.addEventListener('touchstart', (e) => {
    for (const touch of e.changedTouches) {
      launchRocket(touch.clientX, touch.clientY);
    }
  }, { passive: true });
})();
