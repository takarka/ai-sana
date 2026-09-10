// Сквозная WebGL-сцена лендинга — порт eighth-version/scene.js на TypeScript.
// Шейдеры, геометрия и все числовые константы перенесены дословно: это и есть
// картинка, любое «улучшение» здесь меняет визуал (план 04-landing-migration.md,
// §3 — «переносится как Angular-компонент, инициализация только в браузере»).
//
// Модуль намеренно не зависит от Angular и грузится только динамическим
// import() из scene.ts: так three (~600kB raw) уезжает в отдельный ленивый
// чанк и не попадает в initial-бандл (бюджет 650kb/1mb в project.json).
import * as THREE from 'three';

// 3D simplex noise (Ashima/webgl-noise, MIT) для displacement сферы
const SNOISE = /* glsl */ `
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

const VERT = /* glsl */ `
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

  /* размер точки падает с глубиной */
  gl_PointSize = uSize * aScale * uPixelRatio * (7.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uBase;
uniform vec3 uRidge;
uniform float uOpacity;
varying float vRidge;
varying float vDepth;

void main() {
  /* круглая точка с мягким краем */
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.16, d);
  if (a < 0.01) discard;

  vec3 c = mix(uBase, uRidge, vRidge);
  /* дальние точки приглушены — глубина читается без тумана */
  float fade = mix(1.0, 0.22, vDepth);
  gl_FragColor = vec4(c, a * fade * uOpacity);
}`;

const RADIUS = 2.6;

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  /** Цвет «тела» сферы, по умолчанию токен --on-ink-dim. */
  base?: string;
  /** Цвет гряд, по умолчанию токен --signal-lift. */
  ridge?: string;
  particles?: number;
  dpr?: number;
}

export interface ProjectedAnchor {
  x: number;
  y: number;
  visible: boolean;
}

export interface SceneHandle {
  /** Экранные координаты точки на сфере — для пинов героя. */
  projectAnchor(anchor: readonly [number, number, number], out: ProjectedAnchor): ProjectedAnchor;
  /** Подписка на кадр; возвращает функцию отписки. */
  onFrame(listener: () => void): () => void;
  resize(): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}

export function initScene(opts: SceneOptions): SceneHandle {
  const canvas = opts.canvas;
  const count = opts.particles ?? 24000;
  const dpr = opts.dpr ?? 1.5;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.6);

  // точки на сфере, распределение Фибоначчи
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    positions[i * 3] = Math.cos(th) * r * RADIUS;
    positions[i * 3 + 1] = y * RADIUS;
    positions[i * 3 + 2] = Math.sin(th) * r * RADIUS;
    scales[i] = 0.55 + Math.random() * 0.75;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSpread: { value: 1 },
    uLift: { value: 0 },
    uSize: { value: 2.2 },
    uPixelRatio: { value: dpr },
    uOpacity: { value: 0 },
    uBase: { value: new THREE.Color(opts.base || 0x93a2c4) },
    uRidge: { value: new THREE.Color(opts.ridge || 0x7e8bff) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const globe = new THREE.Points(geometry, material);
  scene.add(globe);

  // Состояние сцены: цель + лерп к ней. В eighth-version setTarget()/setMouse()
  // существовали, но их никто не вызывал — сфера всегда живёт на этих
  // значениях, поэтому здесь они просто константы стартового состояния.
  const panX = 2.4;
  const spread = 1;
  const lift = 0;

  const frameListeners = new Set<() => void>();
  const clock = new THREE.Clock();
  let disposed = false;
  let paused = false;
  let fadeIn = 0;

  function frame(): void {
    if (disposed) return;
    if (!paused) {
      const dt = Math.min(clock.getDelta(), 0.05);

      uniforms.uTime.value += dt;
      uniforms.uSpread.value = spread;
      uniforms.uLift.value = lift;
      if (fadeIn < 1) fadeIn = Math.min(1, fadeIn + dt * 0.9);
      uniforms.uOpacity.value = fadeIn;

      globe.position.x = panX;
      globe.rotation.y = uniforms.uTime.value * 0.035;

      renderer.render(scene, camera);
      for (const listener of frameListeners) listener();
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  const projected = new THREE.Vector3();

  return {
    projectAnchor(anchor, out) {
      projected.set(anchor[0], anchor[1], anchor[2]).multiplyScalar(RADIUS).applyMatrix4(globe.matrixWorld);
      const facing =
        projected.clone().sub(camera.position).normalize().dot(projected.clone().normalize()) < 0;
      projected.project(camera);
      out.x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      out.y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      out.visible = facing && projected.z < 1;
      return out;
    },
    onFrame(listener) {
      frameListeners.add(listener);
      return () => frameListeners.delete(listener);
    },
    resize() {
      if (disposed) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    },
    setPaused(next) {
      // Пауза не только экономит GPU, но и обнуляет накопленную дельту:
      // clock.getDelta() после долгого перерыва вернул бы один огромный шаг.
      if (!next && paused) clock.getDelta();
      paused = next;
    },
    dispose() {
      disposed = true;
      frameListeners.clear();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
