// WebGL Scene Controller for AI Academy & PISA Platform
// Uses Three.js via ES Modules for modern, high-performance 3D graphics

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class WebGLHeroScene {
  constructor(canvasContainerId, bgCanvasId) {
    this.container = document.getElementById(canvasContainerId);
    this.bgCanvas = document.getElementById(bgCanvasId);
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isRunning = true;
    this.isHoveringNode = false;
    this.activeNodeIndex = -1;

    // Node definitions matching the 1-4, 5-8, 9-11 grades and PISA track
    this.nodesData = [
      {
        id: 'kids',
        titleRu: '1–4 классы: AI Юниор',
        titleKz: '1–4 сынып: AI Юниор',
        subRu: 'Сказки, визуальный креатив и логика',
        subKz: 'Ертегілер, көрнекі креатив және логика',
        color: 0x10B981, // Emerald green
        radius: 2.1,
        speed: 0.6,
        angle: 0,
        yOffset: 0.4
      },
      {
        id: 'middle',
        titleRu: '5–8 классы: AI Explorer',
        titleKz: '5–8 сынып: AI Explorer',
        subRu: 'Промптинг, помощник в учебе и боты',
        subKz: 'Промптинг, оқу көмекшісі және боттар',
        color: 0x3B82F6, // Electric Blue
        radius: 2.4,
        speed: -0.45,
        angle: Math.PI * 0.5,
        yOffset: -0.3
      },
      {
        id: 'high',
        titleRu: '9–11 классы: AI Профи',
        titleKz: '9–11 сынып: AI Профи',
        subRu: 'Python, нейросети и AI-проекты',
        subKz: 'Python, нейрожелілер және AI жобалар',
        color: 0x8B5CF6, // Deep Violet / Indigo
        radius: 2.7,
        speed: 0.35,
        angle: Math.PI * 1.1,
        yOffset: 0.5
      },
      {
        id: 'pisa',
        titleRu: 'Модуль PISA Track',
        titleKz: 'PISA Track модулі',
        subRu: 'Функциональная грамотность и анализ мышления',
        subKz: 'Функционалдық сауаттылық және ойлауды талдау',
        color: 0xF59E0B, // Amber Gold
        radius: 3.0,
        speed: -0.3,
        angle: Math.PI * 1.7,
        yOffset: -0.4
      }
    ];

    this.initHeroScene();
    this.initBgShader();
    this.setupEvents();
    this.setupIntersectionObserver();
    this.animate();
  }

  /* ==========================================================================
     1. HERO 3D NEURAL CORE SCENE
     ========================================================================== */
  initHeroScene() {
    if (!this.container) return;

    const width = this.container.clientWidth || 560;
    const height = this.container.clientHeight || 560;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Root interactive group
    this.coreGroup = new THREE.Group();
    this.scene.add(this.coreGroup);

    // Mouse & Raycasting
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2(-1000, -1000);

    // 1.1 Central Icosahedron Crystal (Quantum AI Core)
    const crystalGeo = new THREE.IcosahedronGeometry(1.3, 1);
    this.crystalWireMat = new THREE.MeshBasicMaterial({
      color: 0x3B82F6,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, this.crystalWireMat);
    this.coreGroup.add(this.crystalMesh);

    // Inner glowing sphere
    const innerCoreGeo = new THREE.SphereGeometry(0.85, 24, 24);
    this.innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x1E40AF,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    this.innerCoreMesh = new THREE.Mesh(innerCoreGeo, this.innerCoreMat);
    this.coreGroup.add(this.innerCoreMesh);

    // 1.2 Particle Cloud (Synaptic Cloud)
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.3 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.particleSystem = new THREE.Points(particleGeo, this.particleMat);
    this.coreGroup.add(this.particleSystem);

    // 1.3 Orbiting Course & Track Nodes
    this.nodeMeshes = [];
    this.orbitLines = [];

    this.nodesData.forEach((node, idx) => {
      // Orbital ring path
      const ringGeo = new THREE.BufferGeometry();
      const ringPoints = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * node.radius, node.yOffset, Math.sin(theta) * node.radius));
      }
      ringGeo.setFromPoints(ringPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.15
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      this.coreGroup.add(ringLine);
      this.orbitLines.push(ringLine);

      // Node Sphere
      const sphereGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.85
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = { nodeIndex: idx, originalScale: 1.0, data: node };

      // Outer glow ring around node
      const outerRingGeo = new THREE.RingGeometry(0.3, 0.38, 24);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
      sphereMesh.add(outerRingMesh);
      sphereMesh.userData.outerRing = outerRingMesh;

      this.coreGroup.add(sphereMesh);
      this.nodeMeshes.push(sphereMesh);
    });

    // Synapse Connecting Lines between nodes and core
    this.synapseGeo = new THREE.BufferGeometry();
    const synapsePositions = new Float32Array(this.nodesData.length * 2 * 3);
    this.synapseGeo.setAttribute('position', new THREE.BufferAttribute(synapsePositions, 3));
    this.synapseMat = new THREE.LineSegments(
      this.synapseGeo,
      new THREE.LineBasicMaterial({
        color: 0x3B82F6,
        transparent: true,
        opacity: 0.25
      })
    );
    this.coreGroup.add(this.synapseMat);

    this.clock = new THREE.Clock();
  }

  /* ==========================================================================
     2. BACKGROUND AMBIENT GLSL SHADER (Fluid Aurora Noise)
     ========================================================================== */
  initBgShader() {
    if (!this.bgCanvas) return;

    this.bgRenderer = new THREE.WebGLRenderer({
      canvas: this.bgCanvas,
      antialias: false,
      powerPreference: 'low-power'
    });
    this.bgRenderer.setSize(window.innerWidth, window.innerHeight);
    this.bgRenderer.setPixelRatio(1); // 1x is optimal for subtle ambient background blur

    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    this.bgUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTheme: { value: isLight ? 1.0 : 0.0 }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uTheme;
      varying vec2 vUv;

      // 2D Simplex-like noise helper
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Subtle mouse ripple
        float mDist = distance(st, uMouse);
        float mouseWave = sin(mDist * 10.0 - uTime * 1.5) * exp(-mDist * 2.8);

        // Fluid noise computation
        float t = uTime * 0.07;
        float n1 = snoise(st * 1.2 + vec2(t * 0.4, t * 0.3));
        float n2 = snoise(st * 2.2 - vec2(t * 0.5, -t * 0.2) + mouseWave * 0.12);
        float aurora = smoothstep(-0.3, 0.7, n1 * 0.6 + n2 * 0.4);

        // Palette Dark: Deep Navy #080C16 + Electric Cobalt #2563EB + Emerald #10B981
        vec3 darkBg = vec3(0.031, 0.047, 0.086);
        vec3 darkCobalt = vec3(0.145, 0.388, 0.922);
        vec3 darkEmerald = vec3(0.063, 0.725, 0.505);
        vec3 darkColor = mix(darkBg, darkCobalt, aurora * 0.32);
        darkColor += darkEmerald * (mouseWave * 0.18);

        // Palette Light: Soft Pearl Slate #F8FAFC + Delicate Sky Indigo
        vec3 lightBg = vec3(0.972, 0.980, 0.988);
        vec3 lightSky = vec3(0.86, 0.92, 0.99);
        vec3 lightMint = vec3(0.88, 0.97, 0.93);
        vec3 lightColor = mix(lightBg, lightSky, aurora * 0.45);
        lightColor += lightMint * (mouseWave * 0.12);

        vec3 finalColor = mix(darkColor, lightColor, uTheme);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const bgMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.bgUniforms,
      depthWrite: false
    });

    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    this.bgScene.add(bgMesh);
  }

  /* ==========================================================================
     3. EVENT BINDINGS (Resize, Pointer, Theme)
     ========================================================================== */
  setupEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (this.container && this.camera && this.renderer) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }

      if (this.bgRenderer && this.bgUniforms) {
        this.bgRenderer.setSize(window.innerWidth, window.innerHeight);
        this.bgUniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    });

    // Mouse Move on Hero Container
    if (this.container) {
      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        this.mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

        this.mouseVector.x = this.mouse.targetX;
        this.mouseVector.y = this.mouse.targetY;
      });

      this.container.addEventListener('mouseleave', () => {
        this.mouse.targetX = 0;
        this.mouse.targetY = 0;
        this.mouseVector.x = -1000;
        this.mouseVector.y = -1000;
        this.hideNodeTooltip();
      });

      // Click on node: scroll or switch to relevant age tab
      this.container.addEventListener('click', () => {
        if (this.activeNodeIndex >= 0) {
          const node = this.nodesData[this.activeNodeIndex];
          window.dispatchEvent(new CustomEvent('nodeSelected', { detail: { nodeId: node.id } }));
        }
      });
    }

    // Global mouse for background fluid shader
    window.addEventListener('mousemove', (e) => {
      if (this.bgUniforms) {
        const aspect = window.innerWidth / window.innerHeight;
        this.bgUniforms.uMouse.value.set(
          (e.clientX / window.innerWidth) * aspect,
          1.0 - (e.clientY / window.innerHeight)
        );
      }
    });

    // Theme Toggle Synchronizer
    window.addEventListener('themeChanged', (e) => {
      const isLight = e.detail.theme === 'light';
      this.updateThemeVisuals(isLight);
    });

    // Language Changed Synchronizer
    window.addEventListener('languageChanged', () => {
      if (this.activeNodeIndex >= 0) {
        const node = this.nodesData[this.activeNodeIndex];
        this.showNodeTooltip(this.nodeMeshes[this.activeNodeIndex], node);
      }
    });
  }

  updateThemeVisuals(isLight) {
    if (this.bgUniforms) {
      this.bgUniforms.uTheme.value = isLight ? 1.0 : 0.0;
    }

    if (this.crystalWireMat) {
      this.crystalWireMat.color.setHex(isLight ? 0x2563EB : 0x3B82F6);
      this.crystalWireMat.opacity = isLight ? 0.45 : 0.35;
    }
    if (this.innerCoreMat) {
      this.innerCoreMat.color.setHex(isLight ? 0x60A5FA : 0x1E40AF);
      this.innerCoreMat.opacity = isLight ? 0.35 : 0.25;
    }
  }

  /* ==========================================================================
     4. RAYCASTING & NODE INTERACTION
     ========================================================================== */
  checkRaycasting() {
    if (!this.camera || !this.nodeMeshes.length) return;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const nodeIdx = hit.userData.nodeIndex;

      if (this.activeNodeIndex !== nodeIdx) {
        this.activeNodeIndex = nodeIdx;
        this.isHoveringNode = true;
        this.showNodeTooltip(hit, this.nodesData[nodeIdx]);
      }

      // Grow hover node
      hit.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.2);
      if (hit.userData.outerRing) {
        hit.userData.outerRing.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.2);
        hit.userData.outerRing.material.opacity = 0.8;
      }
      this.container.style.cursor = 'pointer';
    } else {
      if (this.activeNodeIndex !== -1) {
        this.nodeMeshes.forEach(mesh => {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
          if (mesh.userData.outerRing) {
            mesh.userData.outerRing.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
            mesh.userData.outerRing.material.opacity = 0.45;
          }
        });
        this.activeNodeIndex = -1;
        this.isHoveringNode = false;
        this.hideNodeTooltip();
        this.container.style.cursor = 'default';
      }
    }
  }

  showNodeTooltip(mesh, nodeData) {
    let tooltip = document.getElementById('webgl-node-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'webgl-node-tooltip';
      tooltip.className = 'webgl-hud-tooltip';
      this.container.appendChild(tooltip);
    }

    const currentLang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';
    const title = currentLang === 'kz' ? nodeData.titleKz : nodeData.titleRu;
    const sub = currentLang === 'kz' ? nodeData.subKz : nodeData.subRu;

    tooltip.innerHTML = `
      <div class="hud-tag" style="border-color: #${nodeData.color.toString(16).padStart(6, '0')};">
        <span class="hud-dot" style="background: #${nodeData.color.toString(16).padStart(6, '0')};"></span>
        <strong>${title}</strong>
      </div>
      <p class="hud-sub">${sub}</p>
      <span class="hud-action">${currentLang === 'kz' ? 'Бағдарламаны қарау →' : 'Смотреть программу →'}</span>
    `;

    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';

    // Position tooltip near center bottom of the canvas
    tooltip.style.left = '50%';
    tooltip.style.bottom = '16px';
    tooltip.style.transform = 'translateX(-50%) translateY(0)';
  }

  hideNodeTooltip() {
    const tooltip = document.getElementById('webgl-node-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.transform = 'translateX(-50%) translateY(8px)';
    }
  }

  /* ==========================================================================
     5. PULSE TRIGGER (Called when student answers interactive question)
     ========================================================================== */
  triggerSynapsePulse(colorHex = 0x10B981) {
    if (!this.synapseMat || !this.innerCoreMesh) return;

    this.synapseMat.material.color.setHex(colorHex);
    this.synapseMat.material.opacity = 0.8;
    this.innerCoreMesh.scale.set(1.4, 1.4, 1.4);

    setTimeout(() => {
      if (this.synapseMat) {
        this.synapseMat.material.color.setHex(0x3B82F6);
        this.synapseMat.material.opacity = 0.25;
      }
      if (this.innerCoreMesh) {
        this.innerCoreMesh.scale.set(1.0, 1.0, 1.0);
      }
    }, 900);
  }

  /* ==========================================================================
     6. PERFORMANCE & VISIBILITY CONTROLLER
     ========================================================================== */
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      this.isRunning = entries[0].isIntersecting;
    }, { threshold: 0.05 });

    if (this.container) {
      observer.observe(this.container);
    }
  }

  /* ==========================================================================
     7. ANIMATION LOOP
     ========================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isRunning) return;

    const delta = this.clock ? this.clock.getDelta() : 0.016;
    const elapsedTime = this.clock ? this.clock.getElapsedTime() : 0;

    // Smooth inertia interpolation for mouse rotation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Slow down rotation if hovering a node to allow easy clicking
    const rotSpeed = this.isHoveringNode ? 0.05 : 0.22;

    if (this.coreGroup && !this.isReducedMotion) {
      this.coreGroup.rotation.y += delta * rotSpeed;
      this.coreGroup.rotation.x = this.mouse.y * 0.25;
      this.coreGroup.rotation.z = -this.mouse.x * 0.15;
    }

    if (this.crystalMesh && !this.isReducedMotion) {
      this.crystalMesh.rotation.x += delta * 0.12;
      this.crystalMesh.rotation.y -= delta * 0.18;
    }

    // Update positions of orbiting nodes & synapse lines
    if (this.nodeMeshes && this.synapseGeo) {
      const synapsePositions = this.synapseGeo.attributes.position.array;
      let posIdx = 0;

      this.nodeMeshes.forEach((mesh, idx) => {
        const data = this.nodesData[idx];
        if (!this.isReducedMotion) {
          data.angle += delta * data.speed * (this.isHoveringNode ? 0.3 : 1.0);
        }

        const x = Math.cos(data.angle) * data.radius;
        const z = Math.sin(data.angle) * data.radius;
        const y = data.yOffset + Math.sin(elapsedTime * 1.8 + idx) * 0.12;

        mesh.position.set(x, y, z);

        // Billboarding for outer ring to always face camera
        if (mesh.userData.outerRing) {
          mesh.userData.outerRing.quaternion.copy(this.camera.quaternion);
        }

        // Connect synapse from center (0,0,0) to node position
        synapsePositions[posIdx++] = 0;
        synapsePositions[posIdx++] = 0;
        synapsePositions[posIdx++] = 0;
        synapsePositions[posIdx++] = x;
        synapsePositions[posIdx++] = y;
        synapsePositions[posIdx++] = z;
      });

      this.synapseGeo.attributes.position.needsUpdate = true;
    }

    // Raycast hit testing
    this.checkRaycasting();

    // Render Hero Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    // Render Background Shader Scene
    if (this.bgRenderer && this.bgScene && this.bgCamera && this.bgUniforms) {
      this.bgUniforms.uTime.value = elapsedTime;
      this.bgRenderer.render(this.bgScene, this.bgCamera);
    }
  }
}
