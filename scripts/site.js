/* Manifest YOU — shared site script: mobile nav, ambient glyphs, ∇ "Zeno" CTA. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  // ── mobile nav ──
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    var setOpen = function (open) {
      document.documentElement.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  // ── ambient glyphs ──
  var amb = document.querySelector('.ambient');
  if (amb && !RM && !amb.children.length) {
    [['∂', 8, 22, 34, 0], ['∇', 84, 16, 40, 7], ['∑', 18, 74, 38, 12], ['λ', 72, 60, 30, 4], ['ε', 92, 40, 36, 18], ['θ', 44, 86, 32, 9]]
      .forEach(function (g) {
        var s = document.createElement('span');
        s.textContent = g[0];
        s.style.cssText = 'left:' + g[1] + '%;top:' + g[2] + '%;--dur:' + g[3] + 's;--delay:' + g[4] + 's';
        amb.appendChild(s);
      });
  }

  // ── ∇ Zeno CTA ──
  // The walker halves the remaining distance every second, so he never arrives.
  // Only a click (or Enter/Space on the button) lets him rise into the ∇.
  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function ss(v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }

  function rings() {
    var svg = el('svg', { viewBox: '0 0 400 400', class: 'zeno-rings', 'aria-hidden': 'true' });
    [[70, 4, 12, ''], [112, 4, 12, 'rev'], [160, 72, 5, '']].forEach(function (r, j) {
      var g = el('g', { class: 'spin ' + r[3] });
      g.appendChild(el('circle', { cx: 200, cy: 200, r: r[0], fill: 'none', stroke: 'currentColor', 'stroke-width': 1, opacity: j === 1 ? .55 : .3, 'vector-effect': 'non-scaling-stroke' }));
      for (var q = 0; q < r[1]; q++) {
        var a = q / r[1] * Math.PI * 2, l = r[1] > 4 ? (q % 6 ? r[2] : r[2] * 2) : r[2];
        g.appendChild(el('line', {
          x1: 200 + Math.cos(a) * (r[0] - l), y1: 200 + Math.sin(a) * (r[0] - l),
          x2: 200 + Math.cos(a) * (r[0] + (r[1] > 4 ? 0 : l)), y2: 200 + Math.sin(a) * (r[0] + (r[1] > 4 ? 0 : l)),
          stroke: 'currentColor', 'stroke-width': 1, opacity: .4, 'vector-effect': 'non-scaling-stroke'
        }));
      }
      svg.appendChild(g);
    });
    return svg;
  }

  function initZeno(root) {
    var btn = root.querySelector('.zeno-nabla');
    if (!btn) return;
    var stage = document.createElement('div');
    stage.className = 'zeno-stage';
    var glow = document.createElement('div');
    glow.className = 'zeno-glow';
    glow.setAttribute('aria-hidden', 'true');
    // phones get a narrower world so the walker stays a readable size
    var narrow = matchMedia('(max-width:560px)').matches;
    var walk = el('svg', { class: 'zeno-walk', viewBox: narrow ? '0 0 380 230' : '0 0 760 200', preserveAspectRatio: 'xMinYMax meet', 'aria-hidden': 'true' });
    var FLOOR = narrow ? 196 : 170, X0 = narrow ? 24 : 30, XT = narrow ? 226 : 520;
    walk.appendChild(el('line', { class: 'floor', x1: 0, y1: FLOOR, x2: narrow ? 380 : 700, y2: FLOOR }));
    var fig = el('g', {});
    var body = el('path', { class: 'fig' });
    var head = el('circle', { class: 'fig', r: 8 });
    fig.appendChild(body); fig.appendChild(head);
    walk.appendChild(fig);
    var dTxt = el('text', { class: 'd', x: 0, y: FLOOR + 24 });
    walk.appendChild(dTxt);
    root.insertBefore(stage, btn);
    stage.appendChild(glow);
    stage.appendChild(rings());
    stage.appendChild(walk);
    stage.appendChild(btn);

    var p = RM ? .85 : 0, t = 0, last = null, clickAt = null, pAtClick = 0, done = false, running = false, visible = false;

    function draw(arrive, up) {
      var x = X0 + (XT - X0) * p;
      var v = clickAt !== null ? 1 : Math.max(.15, 1 - p); // gait never stops, just slows
      var amp = RM ? .35 : .15 + .85 * Math.min(1, v * 1.6);
      var ph = RM ? .6 : t * 5.2;
      var sw = Math.sin(ph) * amp, lean = .25 * amp;
      var hx = x, hy = FLOOR - 34 - Math.abs(Math.cos(ph)) * 3 * amp - up * 70;
      var P = function (a, l, ox, oy) { return [ox + Math.sin(a) * l, oy + Math.cos(a) * l]; };
      var nk = [hx + lean * 28, hy - 28], hd = [hx + lean * 40, hy - 40];
      var k1 = P(sw * .7, 17, hx, hy), f1 = P(sw * .7 - Math.max(0, sw) * .6, 17, k1[0], k1[1]);
      var k2 = P(-sw * .7, 17, hx, hy), f2 = P(-sw * .7 - Math.max(0, -sw) * .6, 17, k2[0], k2[1]);
      var e1 = P(Math.PI - sw * .9, 13, nk[0], nk[1]), h1 = P(Math.PI - sw * .9 + .6, 12, e1[0], e1[1]);
      var e2 = P(Math.PI + sw * .9, 13, nk[0], nk[1]), h2 = P(Math.PI + sw * .9 + .6, 12, e2[0], e2[1]);
      var f = function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); };
      body.setAttribute('d', 'M' + f(f1) + 'L' + f(k1) + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + f(k2) + 'L' + f(f2) +
        'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + f(nk) + 'M' + f(h1) + 'L' + f(e1) + 'L' + f(nk) + 'L' + f(e2) + 'L' + f(h2));
      head.setAttribute('cx', hd[0].toFixed(1));
      head.setAttribute('cy', hd[1].toFixed(1));
      fig.style.opacity = 1 - up;
      dTxt.textContent = arrive >= 1 ? 'd = 0 · arrived' : 'd = ' + (1 - p).toFixed(6);
    }

    function frame(now) {
      if (last === null) last = now;
      var dt = Math.min(.1, (now - last) / 1000);
      last = now; t += dt;
      var arrive = 0, up = 0;
      if (clickAt === null) {
        p = 1 - (1 - p) * Math.pow(.5, dt); // d *= 0.5 per second
      } else {
        var s = t - clickAt;
        arrive = ss(s / .6);
        p = pAtClick + (1 - pAtClick) * arrive;
        up = ss((s - .3) / .5);
        if (s > .9 && !done) { done = true; finish(); }
      }
      draw(arrive, up);
      if ((!done || up < 1) && (visible || clickAt !== null)) requestAnimationFrame(frame); else running = false;
    }

    function finish() {
      root.classList.add('is-arrived');
      root.dispatchEvent(new CustomEvent('zeno:arrived', { bubbles: true }));
      var href = root.getAttribute('data-href');
      if (href) setTimeout(function () { location.href = href; }, RM ? 0 : 450);
    }

    btn.addEventListener('click', function () {
      if (clickAt !== null) return;
      if (RM) { clickAt = t; draw(1, 1); done = true; finish(); return; }
      clickAt = t; pAtClick = p;
      if (!running) { running = true; last = null; requestAnimationFrame(frame); }
    });

    draw(0, 0);
    if (RM) return;
    // walk only while visible
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !running && !done) { running = true; last = null; requestAnimationFrame(frame); }
    }).observe(root);
  }

  document.querySelectorAll('.zeno').forEach(initZeno);

  // scroll state for phone-only chrome (the floating ∇ tab)
  var de = document.documentElement, sq = false;
  function scrolled() {
    sq = false;
    de.classList.toggle('is-scrolled', scrollY > innerHeight * .6);
    de.classList.toggle('at-end', scrollY + innerHeight > de.scrollHeight - 260);
  }
  addEventListener('scroll', function () { if (!sq) { sq = true; requestAnimationFrame(scrolled); } }, { passive: true });
  scrolled();
})();
