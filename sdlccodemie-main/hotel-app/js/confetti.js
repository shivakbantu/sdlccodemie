(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Confetti = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  function createParticles(count, width, rng) {
    rng = rng || Math.random;
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({
        x: rng() * width,
        y: -20 - rng() * 120,
        vx: (rng() - 0.5) * 6,
        vy: 2 + rng() * 4,
        size: 6 + rng() * 6,
        rot: rng() * Math.PI * 2,
        vr: (rng() - 0.5) * 0.3,
        color: COLORS[Math.floor(rng() * COLORS.length)],
        life: 1
      });
    }
    return out;
  }

  function stepParticle(p, dt) {
    var k = dt || 1;
    p.vy += 0.12 * k;
    p.x += p.vx * k;
    p.y += p.vy * k;
    p.rot += p.vr * k;
    p.life -= 0.004 * k;
    return p;
  }

  function launch(opts) {
    opts = opts || {};
    if (typeof document === 'undefined') return function () {};
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return function () {};

    var canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    var parts = createParticles(opts.count || 160, w);
    var raf = 0;
    var stopped = false;

    function stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    function frame() {
      if (stopped) return;
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      parts.forEach(function (p) {
        stepParticle(p, 1);
        if (p.life <= 0 || p.y > h + 30) return;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(frame);
      else stop();
    }

    raf = requestAnimationFrame(frame);
    return stop;
  }

  return { COLORS: COLORS, createParticles: createParticles, stepParticle: stepParticle, launch: launch };
});
