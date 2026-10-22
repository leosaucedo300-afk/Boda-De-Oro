/* ==========================================================
   POLVO DORADO
   Partículas flotantes + explosiones de destellos y hojitas
   doradas sobre un <canvas>. Lo usan portada.html e index.html
   ========================================================== */
window.GoldDust = (function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sprite pre-renderizado (un punto con brillo) para no usar shadowBlur
  function makeSprite() {
    const s = document.createElement("canvas");
    s.width = s.height = 32;
    const c = s.getContext("2d");
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,246,214,1)");
    g.addColorStop(0.25, "rgba(240,217,156,.9)");
    g.addColorStop(0.6, "rgba(212,175,98,.25)");
    g.addColorStop(1, "rgba(212,175,98,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    return s;
  }

  function create(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const sprite = makeSprite();
    const motes = [];
    const bits = [];
    let w = 0, h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener("resize", resize);

    function newMote(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 20,
        size: Math.random() * 7 + 3,
        vy: -(Math.random() * 0.28 + 0.06),
        vx: (Math.random() - 0.5) * 0.18,
        tw: Math.random() * Math.PI * 2,
        ts: Math.random() * 0.025 + 0.008,
      };
    }

    const count = reduceMotion ? 0 : (opts.count ?? 45);
    for (let i = 0; i < count; i++) motes.push(newMote(true));

    /** Explosión de destellos y hojitas doradas en (x, y) */
    function burst(x, y, amount = 70, power = 1) {
      if (reduceMotion) return;
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (Math.random() * 6 + 1.5) * power;
        bits.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 2.5 * power,
          life: 1,
          decay: Math.random() * 0.012 + 0.007,
          size: Math.random() * 4 + 2,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.25,
          leaf: Math.random() < 0.45,
        });
      }
      start();
    }

    function drawLeaf(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // el "aplastamiento" simula que la hoja gira en 3D
      ctx.scale(1, Math.abs(Math.sin(p.rot * 1.7)) * 0.8 + 0.2);
      const g = ctx.createLinearGradient(-p.size * 2, 0, p.size * 2, 0);
      g.addColorStop(0, "#a87d32");
      g.addColorStop(0.5, "#f6e3a8");
      g.addColorStop(1, "#c99a45");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 2, p.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let running = false;
    function start() {
      if (!running) { running = true; requestAnimationFrame(frame); }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        m.tw += m.ts;
        if (m.y < -20 || m.x < -20 || m.x > w + 20) Object.assign(m, newMote(false));
        ctx.globalAlpha = Math.max(0, 0.25 + Math.sin(m.tw) * 0.45) * (opts.opacity ?? 1);
        ctx.drawImage(sprite, m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
      }

      for (let i = bits.length - 1; i >= 0; i--) {
        const p = bits[i];
        p.vy += 0.11;           // gravedad
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= p.decay;
        if (p.life <= 0) { bits.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        if (p.leaf) drawLeaf(p);
        else ctx.drawImage(sprite, p.x - p.size * 1.5, p.y - p.size * 1.5, p.size * 3, p.size * 3);
      }

      ctx.globalAlpha = 1;
      if (motes.length || bits.length) requestAnimationFrame(frame);
      else running = false;
    }

    start();
    return { burst };
  }

  return { create };
})();
