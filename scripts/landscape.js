// The shared loss landscape behind the site's pages.
// Use: <canvas class="ls-canvas" data-mode="quiet|humans" aria-hidden="true"></canvas>
//      plus the importmap for three and <script type="module" src="/scripts/landscape.js">.
//   quiet  : the homepage's gold landscape, dim, drifting slowly as you scroll (content pages)
//   humans : a dawn version (emerald → rose). The ∇ starts at rest in the bowl and climbs out.
// No WebGL or reduced motion → the canvas is removed and the page stays flat.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.querySelector('.ls-canvas');
const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let gl = null; try { gl = canvas && (canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch (e) {}
if (!canvas) { /* nothing to do */ }
else if (!gl || RM) { canvas.remove(); root.classList.add('no-ls'); }
else init();

function init() {
root.classList.add('has-ls');
const MODE = canvas.dataset.mode === 'humans' ? 'humans' : 'quiet';
const HUM = MODE === 'humans';
const PHONE = innerWidth <= 700;
const css = getComputedStyle(root);
const C = n => new THREE.Color(css.getPropertyValue(n).trim() || '#000');
const VOID = C('--void');
const LOW = HUM ? new THREE.Color('#4e6b4a') : C('--tan');     // high ground
const MID = HUM ? new THREE.Color('#a8d38d') : C('--gilt');
const HIGH = HUM ? new THREE.Color('#e7b8c8') : C('--gilt');   // low ground glows
const STAR = HUM ? new THREE.Color('#f3e7c8') : C('--gilt');

// humans: one soft bowl you have settled in, ripples around it, a ridge toward the light
// quiet: the homepage's landscape (fake bottom + real bottom)
const BOWL = [0, 0], RIDGE = [6.5, -6.5], LOCAL = [-4, 3], GLOBAL = [3, -4];
function loss(x, z) {
  const g = (cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / s);
  if (HUM) {
    const r = Math.hypot(x - BOWL[0], z - BOWL[1]);
    return 0.012 * (x * x + z * z) - 1.9 * g(...BOWL, 5) + 0.9 * g(...RIDGE, 9) + 0.12 * Math.cos(r * 1.6) * Math.exp(-r / 7);
  }
  return 0.024 * (x * x + z * z) - 2.3 * g(...GLOBAL, 6) - 1.35 * g(...LOCAL, 2.4) + 0.22 * Math.sin(0.9 * x) * Math.cos(0.8 * z);
}
const H = 1.7, Y = (x, z) => loss(x, z) * H;

const renderer = new THREE.WebGLRenderer({canvas, antialias: !PHONE, alpha: false, powerPreference: HUM ? 'high-performance' : 'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio, HUM ? (PHONE ? 1.5 : 2) : 1.25));
const scene = new THREE.Scene();
scene.background = VOID;
scene.fog = new THREE.FogExp2(VOID, HUM ? (PHONE ? 0.034 : 0.026) : (PHONE ? 0.045 : 0.036));
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

const N = HUM ? (PHONE ? 110 : 160) : (PHONE ? 80 : 120), SPAN = 11;
const pos = new Float32Array(N * N * 3), col = new Float32Array(N * N * 3);
let i = 0, yMin = Infinity, yMax = -Infinity;
const grid = (a) => -SPAN + 2 * SPAN * a / (N - 1);
for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const y = Y(grid(a), grid(b)); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
  const x = grid(a), z = grid(b), y = Y(x, z);
  const depth = 1 - (y - yMin) / (yMax - yMin), edge = Math.max(0, 1 - Math.hypot(x, z) / SPAN);
  const c = depth < .5 ? LOW.clone().lerp(MID, depth * 2) : MID.clone().lerp(HIGH, (depth - .5) * 2);
  c.multiplyScalar((HUM ? 0.45 + 0.75 * depth : 0.25 + 0.75 * depth) * (0.35 + 0.65 * edge));
  pos.set([x, y, z], i * 3); col.set([c.r, c.g, c.b], i * 3); i++;
}
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
const dots = new THREE.Points(pg, new THREE.PointsMaterial({map: dotTex, alphaTest: 0.02, size: PHONE ? 0.09 : 0.075, vertexColors: true, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending}));
scene.add(dots);

// hairlines across the surface (humans: circles around the bowl, like ripples on water)
const lineMat = new THREE.LineBasicMaterial({color: LOW, transparent: true, opacity: HUM ? .2 : .12, depthWrite: false});
const RES = 120;
if (HUM) {
  for (let r = 1; r <= 10; r += 1) { const p = []; for (let a = 0; a <= RES; a++) { const t = a / RES * Math.PI * 2, x = BOWL[0] + Math.cos(t) * r, z = BOWL[1] + Math.sin(t) * r; p.push(new THREE.Vector3(x, Y(x, z) + 0.01, z)); } scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lineMat)); }
} else {
  const STEP = PHONE ? 8 : 6;
  for (let k = 0; k <= 2 * SPAN; k += 2 * SPAN / STEP / 2) {
    const c = -SPAN + k;
    for (const fx of [t => [t, c], t => [c, t]]) { const p = []; for (let r = 0; r <= RES; r++) { const t = -SPAN + 2 * SPAN * r / RES; const [x, z] = fx(t); p.push(new THREE.Vector3(x, Y(x, z) + 0.01, z)); } scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lineMat)); }
  }
}

// the ∇
const nabla = new THREE.Group();
const tri = (s, op) => { const p = [[0, -s], [-s * .87, s * .5], [s * .87, s * .5], [0, -s]].map(([x, y]) => new THREE.Vector3(x, y, 0)); return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({color: STAR, transparent: true, opacity: op})); };
nabla.add(tri(0.42, 1), tri(0.21, .45));
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); const [r, gg, b] = HUM ? [231, 184, 200] : [217, 178, 111]; g.addColorStop(0, 'rgba(255,240,220,1)'); g.addColorStop(.25, `rgba(${r},${gg},${b},.5)`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
glow.scale.set(0.75, 0.75, 1); nabla.add(glow);
scene.add(nabla);
const TRAIL = 60, trailPos = new Float32Array(TRAIL * 3);
const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
const trailMat = new THREE.LineBasicMaterial({color: STAR, transparent: true, opacity: .3});
scene.add(new THREE.Line(trailGeo, trailMat));
let trailInit = false;

// humans: from rest in the bowl, out over the ripples, up to the ridge
// quiet: the homepage's route, walked slowly across the whole page
const ROUTE = HUM ? [BOWL, [1.6, 1.2], [3.4, -1.2], [4.6, -3.8], RIDGE] : [[-9, 9], [-6.6, 6], LOCAL, [-1.1, 0.4], [1.4, -2.3], GLOBAL];
const route = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
const smooth = x => x * x * (3 - 2 * x);
const band = (s, a, b) => smooth(Math.min(1, Math.max(0, (s - a) / (b - a))));

let composer = null, bloom = null;
if (HUM) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 0.3);
  composer.addPass(bloom); composer.addPass(new OutputPass());
}
function size() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); if (composer) { composer.setSize(w, h); bloom.setSize(w, h); }
  camera.aspect = w / h;
  if (!PHONE) camera.setViewOffset(w, h, -w * (HUM ? 0.18 : 0.0), 0, w, h); else camera.setViewOffset(w, h, 0, h * 0.18, w, h);
  camera.updateProjectionMatrix();
}
addEventListener('resize', size); size();

// scroll progress through the whole page, 0..1
let pTarget = 0, p = 0;
const readScroll = () => { const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); pTarget = Math.min(1, Math.max(0, scrollY / max)); };
addEventListener('scroll', readScroll, {passive: true}); readScroll(); p = pTarget;
let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), want = new THREE.Vector3(), look = new THREE.Vector3();
let first = true, last = performance.now(), visible = true, lastDraw = 0;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(frame); } });

function frame(now) {
  if (!visible) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  p += (pTarget - p) * Math.min(1, dt * 3);
  const T = now / 1000;
  // quiet pages: draw at ~30fps, it's background
  if (!HUM && now - lastDraw < 32) { requestAnimationFrame(frame); return; }
  lastDraw = now;

  const t = HUM ? band(p, 0.08, 0.92) : p;
  const q = route.getPoint(t);
  const rest = HUM ? 1 - band(p, 0.02, 0.12) : 0;
  q.y = Y(q.x, q.z) + 0.55 + 0.1 * Math.sin(T * (HUM ? 0.8 : 1.2)) * (0.5 + rest);
  nabla.position.copy(q); nabla.quaternion.copy(camera.quaternion);
  nabla.scale.setScalar((HUM ? 1.1 : 0.9) * (1 + 0.06 * Math.sin(T * Math.PI / 4)));
  glow.material.opacity = HUM ? 0.5 + 0.25 * rest : 0.35;
  if (!trailInit) { for (let k = 0; k < TRAIL; k++) trailPos.set([q.x, q.y, q.z], k * 3); trailInit = true; }
  trailPos.copyWithin(3, 0, (TRAIL - 1) * 3); trailPos.set([q.x, q.y - 0.25, q.z], 0);
  trailGeo.attributes.position.needsUpdate = true;

  if (HUM) {
    // starts close, looking down into the bowl; pulls back and turns toward the ridge (the light)
    const out = band(p, 0.05, 1);
    want.set(-5 + 2.5 * out, 5 + 1.6 * out, 9 + 1.5 * out).add(new THREE.Vector3(q.x * 0.5, 0, q.z * 0.5));
    look.copy(q).lerp(new THREE.Vector3(...[RIDGE[0], Y(...RIDGE), RIDGE[1]]), 0.35 * out);
  } else {
    // slow orbit over the landscape tied to page scroll
    const a = -0.6 + p * 1.4;
    want.set(Math.sin(a) * 15, 7.5 - p * 2, Math.cos(a) * 15);
    look.set(0, -1, 0).lerp(q, 0.4);
  }
  want.x += mx * 1.0; want.y -= my * 0.6;
  if (first) { camPos.copy(want); camLook.copy(look); first = false; }
  camPos.lerp(want, Math.min(1, dt * 2.5)); camLook.lerp(look, Math.min(1, dt * 3));
  camera.position.copy(camPos); camera.lookAt(camLook);
  dots.material.opacity = 0.75 + 0.15 * Math.sin(T * 0.5);

  if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
}

// sections rise in as you reach them (only when the landscape runs)
if (root.classList.contains('has-ls')) {
  const els = [...document.querySelectorAll('main section, main > header, main > article, main > .form-wrap')].filter(el => el.getBoundingClientRect().top > innerHeight * 0.9);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ls-in'); io.unobserve(e.target); } }), {threshold: 0.12, rootMargin: '0px 0px -5% 0px'});
  els.forEach(el => { el.classList.add('ls-rise'); io.observe(el); });
}
