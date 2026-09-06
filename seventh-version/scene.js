/* ============================================================
   AI Sana — сквозная WebGL-сцена
   Один fixed-canvas под всей страницей. Виден только сквозь
   .band--ink (они прозрачны), .band--paper его закрывают —
   чередование полос из ограничения превращается в приём.

   Палитра строго в системе (DESIGN.md §4, один акцент):
     база  --on-ink-dim  #93A2C4
     гряда --signal-lift #7E8BFF

   Модуль грузится лениво и только за гейтами (см. bootScene в app.js).
   ============================================================ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* 3D simplex noise (Ashima/webgl-noise, MIT). В third-version/webgl-scene.js
   лежит только 2D-вариант — для displacement сферы он не подходит. */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

const VERT = /* glsl */`
${SNOISE}
uniform float uTime;
uniform float uSpread;
uniform float uLift;
uniform float uSize;
uniform float uPixelRatio;
attribute float aScale;
varying float vRidge;
varying float vDepth;

void main() {
  vec3 dir = normalize(position);
  /* гряды: медленно ползущий 3D-шум по направлению точки */
  float n = snoise(dir * 1.35 + vec3(0.0, uTime * 0.045, 0.0));
  vRidge = smoothstep(0.16, 0.62, n);

  vec3 p = position * (1.0 + n * 0.16 * uSpread);
  p.y += uLift;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = clamp((-mv.z - 3.0) / 9.0, 0.0, 1.0);

  /* размер точки падает с глубиной — приём mazehq.com */
  gl_PointSize = uSize * aScale * uPixelRatio * (7.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
precision mediump float;
uniform vec3 uBase;
uniform vec3 uRidge;
uniform float uOpacity;
varying float vRidge;
varying float vDepth;

void main() {
  /* круглая точка с мягким краем, а не квадрат PointsMaterial */
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.16, d);
  if (a < 0.01) discard;

  vec3 c = mix(uBase, uRidge, vRidge);
  /* дальние точки приглушены — глубина читается без тумана */
  float fade = mix(1.0, 0.22, vDepth);
  gl_FragColor = vec4(c, a * fade * uOpacity);
}`;

export function initScene(opts) {
  const canvas = opts.canvas;
  const COUNT = opts.particles || 24000;
  const DPR = opts.dpr || 1.5;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.6);

  /* --- точки на сфере, распределение Фибоначчи (без сгущения у полюсов) --- */
  const pos = new Float32Array(COUNT * 3);
  const scale = new Float32Array(COUNT);
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = GOLDEN * i;
    pos[i * 3]     = Math.cos(th) * r * 2.6;
    pos[i * 3 + 1] = y * 2.6;
    pos[i * 3 + 2] = Math.sin(th) * r * 2.6;
    scale[i] = 0.55 + Math.random() * 0.75;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSpread: { value: 1 },
    uLift: { value: 0 },
    uSize: { value: 2.2 },
    uPixelRatio: { value: DPR },
    uOpacity: { value: 0 },                        /* появление после первого кадра */
    uBase: { value: new THREE.Color(0x93a2c4) },   /* --on-ink-dim */
    uRidge: { value: new THREE.Color(0x7e8bff) }   /* --signal-lift */
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    /* НЕ AdditiveBlending: фон под paper-полосами не чёрный,
       аддитив дал бы светлые артефакты на краях */
    blending: THREE.NormalBlending
  });

  const globe = new THREE.Points(geo, mat);
  scene.add(globe);

  /* --- состояние: цель + лерп, чтобы скролл не дёргал камеру --- */
  /* стартовые значения = состояние #hero: сфера сразу справа,
     иначе при загрузке она выползала бы из центра */
  const cur = { camZ: 7.6, rotY: 0, spread: 1, lift: 0, panX: 2.4, dim: 1, mx: 0, my: 0 };
  const tgt = { camZ: 7.6, rotY: 0, spread: 1, lift: 0, panX: 2.4, dim: 1, mx: 0, my: 0 };

  let running = true;
  let visible = true;
  let disposed = false;
  let fadeIn = 0;
  const clock = new THREE.Clock();

  function frame() {
    if (disposed || !running || !visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);

    cur.camZ   += (tgt.camZ   - cur.camZ)   * 0.045;
    cur.rotY   += (tgt.rotY   - cur.rotY)   * 0.045;
    cur.spread += (tgt.spread - cur.spread) * 0.045;
    cur.lift   += (tgt.lift   - cur.lift)   * 0.045;
    cur.panX   += (tgt.panX   - cur.panX)   * 0.045;
    cur.dim    += (tgt.dim    - cur.dim)    * 0.045;
    cur.mx     += (tgt.mx     - cur.mx)     * 0.05;
    cur.my     += (tgt.my     - cur.my)     * 0.05;

    uniforms.uTime.value += dt;
    uniforms.uSpread.value = cur.spread;
    uniforms.uLift.value = cur.lift;
    /* появление после первого кадра, дальше — приглушение по секции:
       там, где секция плотно занята текстом, сцена уходит в фон */
    if (fadeIn < 1) fadeIn = Math.min(1, fadeIn + dt * 0.9);
    uniforms.uOpacity.value = fadeIn * cur.dim;

    camera.position.z = cur.camZ;
    globe.position.x = cur.panX;
    globe.rotation.y = cur.rotY + uniforms.uTime.value * 0.035;
    globe.rotation.x = cur.my * 0.22;
    globe.rotation.z = -cur.mx * 0.1;

    renderer.render(scene, camera);
    if (opts.onFrame) opts.onFrame();
  }

  /* Единый тикер GSAP, а не собственный rAF: иначе два независимых
     цикла и lagSmoothing(0) на сцену не действует. */
  let usingGsap = false;
  function start() {
    if (window.gsap) { usingGsap = true; gsap.ticker.add(frame); }
    else { (function loop() { if (!disposed) { requestAnimationFrame(loop); frame(); } })(); }
  }

  function resize() {
    if (disposed) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  /* --- пауза, когда ни одна ink-полоса не видна ---
     Множество, а не счётчик: первый колбэк приходит сразу для ВСЕХ
     наблюдаемых элементов, и оффскринные увели бы счётчик в минус. */
  const inkVisible = new Set();
  const inkIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) inkVisible.add(e.target);
      else inkVisible.delete(e.target);
    });
    visible = inkVisible.size > 0;
  }, { threshold: 0 });
  document.querySelectorAll(".band--ink").forEach(function (b) { inkIO.observe(b); });

  function onVis() { running = !document.hidden; }
  document.addEventListener("visibilitychange", onVis);

  function onLost(e) { e.preventDefault(); running = false; }
  canvas.addEventListener("webglcontextlost", onLost);

  start();

  const _v = new THREE.Vector3();

  return {
    setTarget: function (s) {
      if (s.camZ !== undefined) tgt.camZ = s.camZ;
      if (s.rotY !== undefined) tgt.rotY = s.rotY;
      if (s.spread !== undefined) tgt.spread = s.spread;
      if (s.lift !== undefined) tgt.lift = s.lift;
      if (s.panX !== undefined) tgt.panX = s.panX;
      if (s.dim !== undefined) tgt.dim = s.dim;
    },
    setMouse: function (x, y) { tgt.mx = x; tgt.my = y; },
    resize: resize,
    pause: function () { running = false; },
    resume: function () { running = true; },
    /* проекция 3D-якоря в координаты вьюпорта (canvas = весь вьюпорт) */
    projectAnchor: function (a, out) {
      _v.set(a[0], a[1], a[2]).multiplyScalar(2.6).applyMatrix4(globe.matrixWorld);
      const facing = _v.clone().sub(camera.position).normalize()
                       .dot(_v.clone().normalize()) < 0;
      _v.project(camera);
      out.x = (_v.x * 0.5 + 0.5) * window.innerWidth;
      out.y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
      out.visible = facing && _v.z < 1;
      return out;
    },
    dispose: function () {
      disposed = true;
      if (usingGsap && window.gsap) gsap.ticker.remove(frame);
      inkIO.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      geo.dispose(); mat.dispose(); renderer.dispose();
    }
  };
}
