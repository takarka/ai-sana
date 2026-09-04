/**
 * AI Sana EDU — Core Interactive Engine (Version 6)
 * Includes:
 * 1. Procedural 3D Robot Mascot (Three.js WebGL, 100% self-contained, no external .glb)
 * 2. Perspective Dual Controller (Student view vs Teacher view)
 * 3. Teacher Dashboard Simulator (Class 2-A / 4-B with live student telemetry)
 * 4. Interactive Curriculum Catalog with Accordion
 * 5. Showcase Micro-Demos (Branching Story, Animal Classifier, School Chatbot)
 * 6. Dynamic School License Calculator with WhatsApp Lead Generator
 * 7. FAQ Accordion & Modals
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. Messenger Lead Generator
  // ==========================================================================
  const PHONE_NUMBER = "77001234567";
  const TELEGRAM_BOT = "aisana_edu_bot";

  function openMessengerLead(role, targetAction, extraDetails = "") {
    let msg = `Здравствуйте! Меня интересует образовательная платформа AI Sana EDU.\n`;
    msg += `Моя роль: ${role}\n`;
    msg += `Цель обращения: ${targetAction}\n`;
    if (extraDetails) {
      msg += `Параметры: ${extraDetails}\n`;
    }
    msg += `Пожалуйста, свяжитесь со мной для предоставления материалов и доступа.`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${PHONE_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  function openTelegramLead(targetAction) {
    const tgUrl = `https://t.me/${TELEGRAM_BOT}?start=${encodeURIComponent(targetAction)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  }

  // ==========================================================================
  // 2. Procedural 3D Robot Mascot (Three.js)
  // ==========================================================================
  const canvas = document.getElementById('robot-3d-canvas');
  const container = document.getElementById('three-container');

  if (canvas && container && typeof THREE !== 'undefined') {
    initRobot3D(canvas, container);
  }

  function initRobot3D(canvasEl, containerEl) {
    // 2.1 Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, containerEl.clientWidth / containerEl.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.4, 4.4);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2.2 Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(4, 6, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const softFillLight = new THREE.PointLight(0x2563eb, 0.4, 10);
    softFillLight.position.set(0, -2, 2);
    scene.add(softFillLight);

    // 2.3 Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.1
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.3
    });

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.15,
      metalness: 0.6
    });

    const accentBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.25,
      metalness: 0.2
    });

    const glowCyanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.6
    });

    // 2.4 Robot Hierarchy
    const robotRoot = new THREE.Group();
    scene.add(robotRoot);

    // Torso (Capsule-like body)
    const torsoGeo = new THREE.CylinderGeometry(0.62, 0.52, 0.95, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    torsoMesh.position.y = -0.3;
    robotRoot.add(torsoMesh);

    // Chest Badge / Core Reactor
    const chestCoreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24);
    chestCoreGeo.rotateX(Math.PI / 2);
    const chestCoreMesh = new THREE.Mesh(chestCoreGeo, accentBlueMat);
    chestCoreMesh.position.set(0, -0.2, 0.58);
    robotRoot.add(chestCoreMesh);

    const chestGlowGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const chestGlowMesh = new THREE.Mesh(chestGlowGeo, glowCyanMat);
    chestGlowMesh.position.set(0, -0.2, 0.6);
    robotRoot.add(chestGlowMesh);

    // Floating Left & Right Shoulders & Arms
    const shoulderGeo = new THREE.SphereGeometry(0.16, 20, 20);
    
    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.78, -0.15, 0);
    const leftShoulder = new THREE.Mesh(shoulderGeo, darkTrimMat);
    leftArmGroup.add(leftShoulder);
    const leftForearmGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.45, 16);
    leftForearmGeo.translate(0, -0.22, 0);
    const leftForearm = new THREE.Mesh(leftForearmGeo, bodyMat);
    leftArmGroup.add(leftForearm);
    const leftHandGeo = new THREE.SphereGeometry(0.12, 16, 16);
    leftHandGeo.translate(0, -0.46, 0);
    const leftHand = new THREE.Mesh(leftHandGeo, darkTrimMat);
    leftArmGroup.add(leftHand);
    robotRoot.add(leftArmGroup);

    // Right Arm Group (Can wave!)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.78, -0.15, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, darkTrimMat);
    rightArmGroup.add(rightShoulder);
    const rightForearmGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.45, 16);
    rightForearmGeo.translate(0, -0.22, 0);
    const rightForearm = new THREE.Mesh(rightForearmGeo, bodyMat);
    rightArmGroup.add(rightForearm);
    const rightHandGeo = new THREE.SphereGeometry(0.12, 16, 16);
    rightHandGeo.translate(0, -0.46, 0);
    const rightHand = new THREE.Mesh(rightHandGeo, darkTrimMat);
    rightArmGroup.add(rightHand);
    robotRoot.add(rightArmGroup);

    // Head Group (Tracks cursor)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0);
    robotRoot.add(headGroup);

    // Head Base Sphere
    const headGeo = new THREE.SphereGeometry(0.68, 32, 28);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headGroup.add(headMesh);

    // Dark Visor / Screen Face
    const visorGeo = new THREE.SphereGeometry(0.62, 32, 24, 0, Math.PI, 0, Math.PI * 0.55);
    visorGeo.rotateX(Math.PI * 0.18);
    const visorMesh = new THREE.Mesh(visorGeo, screenMat);
    visorMesh.position.set(0, 0.04, 0.09);
    headGroup.add(visorMesh);

    // Dynamic Eyes Canvas Texture
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 256;
    eyeCanvas.height = 128;
    const eyeCtx = eyeCanvas.getContext('2d');
    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
    const eyePlaneMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true
    });
    const eyePlaneGeo = new THREE.PlaneGeometry(0.68, 0.34);
    eyePlaneGeo.rotateY(Math.PI); // facing front
    const eyePlaneMesh = new THREE.Mesh(eyePlaneGeo, eyePlaneMat);
    eyePlaneMesh.position.set(0, 0.08, 0.67);
    headGroup.add(eyePlaneMesh);

    // Ear Headphones
    const earGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 24);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, darkTrimMat);
    leftEar.position.set(-0.67, 0.05, 0);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, darkTrimMat);
    rightEar.position.set(0.67, 0.05, 0);
    headGroup.add(rightEar);

    // Ear Accent Rings
    const earRingGeo = new THREE.RingGeometry(0.12, 0.17, 24);
    earRingGeo.rotateY(Math.PI / 2);
    const leftEarRing = new THREE.Mesh(earRingGeo, glowCyanMat);
    leftEarRing.position.set(-0.73, 0.05, 0);
    headGroup.add(leftEarRing);
    const rightEarRing = new THREE.Mesh(earRingGeo, glowCyanMat);
    rightEarRing.position.set(0.73, 0.05, 0);
    headGroup.add(rightEarRing);

    // Antenna
    const antennaStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 16);
    antennaStemGeo.translate(0, 0.16, 0);
    const antennaStem = new THREE.Mesh(antennaStemGeo, darkTrimMat);
    antennaStem.position.set(0, 0.65, 0);
    headGroup.add(antennaStem);

    const antennaTipGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const antennaTip = new THREE.Mesh(antennaTipGeo, glowCyanMat);
    antennaTip.position.set(0, 0.98, 0);
    headGroup.add(antennaTip);

    // 2.5 Props / Accessory Modes
    // Accessory 1: Artist Beret (Pupil Mode: Draw)
    const beretGroup = new THREE.Group();
    const beretBaseGeo = new THREE.TorusGeometry(0.48, 0.12, 16, 32);
    beretBaseGeo.rotateX(Math.PI / 2);
    const beretMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.6 });
    const beretBase = new THREE.Mesh(beretBaseGeo, beretMat);
    beretGroup.add(beretBase);
    const beretTopGeo = new THREE.SphereGeometry(0.42, 24, 16);
    beretTopGeo.scale(1.2, 0.35, 1.2);
    const beretTop = new THREE.Mesh(beretTopGeo, beretMat);
    beretTop.position.y = 0.08;
    beretGroup.add(beretTop);
    beretGroup.position.set(0.15, 0.62, -0.05);
    beretGroup.rotation.z = -0.22;
    beretGroup.visible = false;
    headGroup.add(beretGroup);

    // Accessory 2: Magic Fairy Tale Book (Pupil Mode: Story)
    const bookGroup = new THREE.Group();
    const bookCoverMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const bookPagesMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.08), bookCoverMat);
    const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.46, 0.06), bookPagesMat);
    bookPages.position.x = 0.02;
    bookGroup.add(bookCover);
    bookGroup.add(bookPages);
    bookGroup.position.set(-0.7, -0.4, 0.4);
    bookGroup.rotation.set(0.4, 0.5, -0.3);
    bookGroup.visible = false;
    robotRoot.add(bookGroup);

    // Accessory 3: Gamepad (Pupil Mode: Game)
    const gamepadGroup = new THREE.Group();
    const padBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.06), darkTrimMat);
    gamepadGroup.add(padBody);
    const btnMatA = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const btnMatB = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const btnA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), btnMatA);
    btnA.position.set(0.12, 0.04, 0.02);
    btnA.rotateX(Math.PI / 2);
    const btnB = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), btnMatB);
    btnB.position.set(0.05, -0.03, 0.02);
    btnB.rotateX(Math.PI / 2);
    gamepadGroup.add(btnA);
    gamepadGroup.add(btnB);
    gamepadGroup.position.set(0.65, -0.42, 0.4);
    gamepadGroup.rotation.set(0.5, -0.3, 0.2);
    gamepadGroup.visible = false;
    robotRoot.add(gamepadGroup);

    // Accessory 4: Academic Mortarboard Cap (Teacher Mode)
    const academicCapGroup = new THREE.Group();
    const capSkull = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.2, 32), darkTrimMat);
    capSkull.position.y = 0.05;
    academicCapGroup.add(capSkull);
    const capSquare = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), darkTrimMat);
    capSquare.position.y = 0.17;
    academicCapGroup.add(capSquare);
    const tasselStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), goldMat);
    tasselStem.position.set(0.35, 0.02, 0.35);
    tasselStem.rotation.z = -0.2;
    academicCapGroup.add(tasselStem);
    academicCapGroup.position.set(0, 0.65, 0);
    academicCapGroup.visible = false;
    headGroup.add(academicCapGroup);

    // 2.6 Eye Drawing States & Blinking
    let eyeState = 'normal'; // 'normal', 'smile', 'blink', 'curious'
    let blinkTimer = 0;
    let isBlinking = false;

    function renderEyes(state) {
      eyeCtx.clearRect(0, 0, 256, 128);

      if (state === 'blink') {
        // Closed line eyes
        eyeCtx.strokeStyle = '#38bdf8';
        eyeCtx.lineWidth = 6;
        eyeCtx.lineCap = 'round';
        eyeCtx.beginPath();
        eyeCtx.moveTo(56, 64);
        eyeCtx.lineTo(96, 64);
        eyeCtx.moveTo(160, 64);
        eyeCtx.lineTo(200, 64);
        eyeCtx.stroke();
      } else if (state === 'smile') {
        // Happy arcs ^ ^
        eyeCtx.strokeStyle = '#38bdf8';
        eyeCtx.lineWidth = 7;
        eyeCtx.lineCap = 'round';
        eyeCtx.beginPath();
        eyeCtx.arc(76, 72, 22, Math.PI * 1.1, Math.PI * 1.9, false);
        eyeCtx.arc(180, 72, 22, Math.PI * 1.1, Math.PI * 1.9, false);
        eyeCtx.stroke();
      } else {
        // Normal oval glowing cyan eyes
        eyeCtx.fillStyle = '#38bdf8';
        eyeCtx.shadowColor = '#06b6d4';
        eyeCtx.shadowBlur = 12;

        // Left eye
        eyeCtx.beginPath();
        eyeCtx.ellipse(76, 64, 20, 28, 0, 0, Math.PI * 2);
        eyeCtx.fill();

        // Right eye
        eyeCtx.beginPath();
        eyeCtx.ellipse(180, 64, 20, 28, 0, 0, Math.PI * 2);
        eyeCtx.fill();

        // Specular eye highlights
        eyeCtx.fillStyle = '#ffffff';
        eyeCtx.shadowBlur = 0;
        eyeCtx.beginPath();
        eyeCtx.arc(82, 54, 6, 0, Math.PI * 2);
        eyeCtx.arc(186, 54, 6, 0, Math.PI * 2);
        eyeCtx.fill();
      }

      eyeTexture.needsUpdate = true;
    }

    renderEyes('normal');

    // 2.7 Mouse / Touch Interaction Tracking
    let targetRotX = 0;
    let targetRotY = 0;
    let isHovered = false;

    function handlePointerMove(clientX, clientY) {
      const rect = containerEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const normX = (clientX - centerX) / (window.innerWidth * 0.5);
      const normY = (clientY - centerY) / (window.innerHeight * 0.5);

      targetRotY = THREE.MathUtils.clamp(normX * 0.65, -0.65, 0.65);
      targetRotX = THREE.MathUtils.clamp(-normY * 0.45, -0.35, 0.35);
    }

    window.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    });

    containerEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    containerEl.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Click on robot triggers happy smile & arm wave
    canvasEl.addEventListener('click', () => {
      renderEyes('smile');
      isWaving = true;
      waveTimer = 0;
      setTimeout(() => {
        if (!isBlinking) renderEyes(eyeState === 'smile' ? 'smile' : 'normal');
      }, 2000);
    });

    // 2.8 Animation Loop
    let isWaving = false;
    let waveTimer = 0;
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Floating / bobbing
      robotRoot.position.y = Math.sin(elapsedTime * 2.2) * 0.08;

      // Soft breathing scale on torso
      torsoMesh.scale.x = 1 + Math.sin(elapsedTime * 1.8) * 0.015;
      torsoMesh.scale.z = 1 + Math.sin(elapsedTime * 1.8) * 0.015;

      // Antenna beacon pulsation
      const glowScale = 1 + Math.sin(elapsedTime * 4) * 0.15;
      antennaTip.scale.set(glowScale, glowScale, glowScale);

      // Smooth cursor tracking via lerp
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetRotY, 0.08);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetRotX, 0.08);

      // Torso slight yaw
      torsoMesh.rotation.y = THREE.MathUtils.lerp(torsoMesh.rotation.y, targetRotY * 0.3, 0.06);

      // Arm waving animation
      if (isWaving) {
        waveTimer += delta * 6;
        rightArmGroup.rotation.z = Math.sin(waveTimer * 2) * 0.6 - 0.4;
        rightArmGroup.rotation.x = 0.3;
        if (waveTimer > Math.PI * 3) {
          isWaving = false;
          rightArmGroup.rotation.z = 0;
          rightArmGroup.rotation.x = 0;
        }
      } else {
        rightArmGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.04;
        leftArmGroup.rotation.z = -Math.sin(elapsedTime * 1.5) * 0.04;
      }

      // Blinking cycle (~4.5s)
      blinkTimer += delta;
      if (blinkTimer > 4.2) {
        isBlinking = true;
        renderEyes('blink');
        if (blinkTimer > 4.38) {
          isBlinking = false;
          renderEyes(eyeState);
          blinkTimer = 0;
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // 2.9 Window Resize Handling
    window.addEventListener('resize', () => {
      if (!containerEl) return;
      const width = containerEl.clientWidth;
      const height = containerEl.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    // 2.10 Public Mascot Controller API
    window.Robot3D = {
      setMode: function(mode) {
        // Reset accessories
        beretGroup.visible = false;
        bookGroup.visible = false;
        gamepadGroup.visible = false;
        academicCapGroup.visible = false;

        if (mode === 'teacher') {
          academicCapGroup.visible = true;
          eyeState = 'normal';
          renderEyes('normal');
        } else if (mode === 'draw') {
          beretGroup.visible = true;
          eyeState = 'smile';
          renderEyes('smile');
          isWaving = true;
          waveTimer = 0;
        } else if (mode === 'story') {
          bookGroup.visible = true;
          eyeState = 'smile';
          renderEyes('smile');
        } else if (mode === 'game') {
          gamepadGroup.visible = true;
          eyeState = 'curious';
          renderEyes('smile');
        } else {
          eyeState = 'normal';
          renderEyes('normal');
        }
      }
    };
  }

  // ==========================================================================
  // 3. Perspective Switcher (Hero Section)
  // ==========================================================================
  const btnPerspectiveStudent = document.getElementById('btn-perspective-student');
  const btnPerspectiveTeacher = document.getElementById('btn-perspective-teacher');
  const studentActionsBar = document.getElementById('student-actions-bar');
  const teacherCompanionWidget = document.getElementById('teacher-companion-widget');

  if (btnPerspectiveStudent && btnPerspectiveTeacher) {
    btnPerspectiveStudent.addEventListener('click', () => {
      btnPerspectiveStudent.classList.add('active');
      btnPerspectiveTeacher.classList.remove('active');
      if (studentActionsBar) studentActionsBar.style.display = 'flex';
      if (teacherCompanionWidget) teacherCompanionWidget.classList.remove('visible');
      if (window.Robot3D) window.Robot3D.setMode('student');
    });

    btnPerspectiveTeacher.addEventListener('click', () => {
      btnPerspectiveTeacher.classList.add('active');
      btnPerspectiveStudent.classList.remove('active');
      if (studentActionsBar) studentActionsBar.style.display = 'none';
      if (teacherCompanionWidget) teacherCompanionWidget.classList.add('visible');
      if (window.Robot3D) window.Robot3D.setMode('teacher');
    });
  }

  // Pupil action triggers (Draw, Story, Game)
  const mascotDraw = document.getElementById('mascot-action-draw');
  const mascotStory = document.getElementById('mascot-action-story');
  const mascotGame = document.getElementById('mascot-action-game');

  function resetActionActive() {
    [mascotDraw, mascotStory, mascotGame].forEach(b => b && b.classList.remove('active'));
  }

  if (mascotDraw) {
    mascotDraw.addEventListener('click', () => {
      resetActionActive();
      mascotDraw.classList.add('active');
      if (window.Robot3D) window.Robot3D.setMode('draw');
    });
  }

  if (mascotStory) {
    mascotStory.addEventListener('click', () => {
      resetActionActive();
      mascotStory.classList.add('active');
      if (window.Robot3D) window.Robot3D.setMode('story');
    });
  }

  if (mascotGame) {
    mascotGame.addEventListener('click', () => {
      resetActionActive();
      mascotGame.classList.add('active');
      if (window.Robot3D) window.Robot3D.setMode('game');
    });
  }

  // Smartboard Quiz trigger in hero teacher widget
  const btnQuizSmartboard = document.getElementById('btn-quiz-smartboard');
  if (btnQuizSmartboard) {
    btnQuizSmartboard.addEventListener('click', () => {
      alert('Интерактивная викторина «Алгоритмы и циклы» отправлена на смарт-доску класса 2-А!');
    });
  }

  // ==========================================================================
  // 4. Teacher Dashboard Simulator (Class 2-A vs 4-B)
  // ==========================================================================
  const dashData = {
    '2a': {
      engagement: '94%',
      focus: '14.2 мин',
      topics: '18 из 24',
      students: [
        { name: 'Алихан С.', avatar: 'АС', quest: 'Квест: Нейросети и звуки', pct: 100, status: 'ahead', statusText: 'Опережает темп ★★★' },
        { name: 'София М.', avatar: 'СМ', quest: 'Квест: Условия ЕСЛИ/ТО (шаг 4/5)', pct: 80, status: 'normal', statusText: 'В норме' },
        { name: 'Дамир К.', avatar: 'ДК', quest: 'Квест: Промпты для художника', pct: 45, status: 'hint', statusText: 'Требуется подсказка' },
        { name: 'Амина Р.', avatar: 'АР', quest: 'Квест: Голосовые помощники', pct: 95, status: 'ahead', statusText: 'Опережает темп' }
      ]
    },
    '4b': {
      engagement: '96%',
      focus: '14.8 мин',
      topics: '21 из 24',
      students: [
        { name: 'Тимур Б.', avatar: 'ТБ', quest: 'Квест: Архитектура нейросети', pct: 100, status: 'ahead', statusText: 'Опережает темп ★★★' },
        { name: 'Дильназ А.', avatar: 'ДА', quest: 'Квест: Логические ветвления', pct: 85, status: 'normal', statusText: 'В норме' },
        { name: 'Максим В.', avatar: 'МВ', quest: 'Квест: Фактчекинг и безопасность', pct: 50, status: 'hint', statusText: 'Требуется подсказка' },
        { name: 'Малика Н.', avatar: 'МН', quest: 'Квест: Диалоговый бот библиотеки', pct: 92, status: 'ahead', statusText: 'Опережает темп' }
      ]
    }
  };

  const tbodyStudents = document.getElementById('dash-students-tbody');
  const metricEngagement = document.getElementById('dash-metric-engagement-val');
  const metricFocus = document.getElementById('dash-metric-focus-val');
  const metricTopics = document.getElementById('dash-metric-topics-val');
  const btnClass2a = document.getElementById('btn-class-2a');
  const btnClass4b = document.getElementById('btn-class-4b');

  function renderDashboardClass(classKey) {
    const data = dashData[classKey];
    if (!data) return;

    if (metricEngagement) metricEngagement.textContent = data.engagement;
    if (metricFocus) metricFocus.textContent = data.focus;
    if (metricTopics) metricTopics.textContent = data.topics;

    if (tbodyStudents) {
      tbodyStudents.innerHTML = '';
      data.students.forEach(s => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-normal';
        if (s.status === 'ahead') statusClass = 'status-ahead';
        if (s.status === 'hint') statusClass = 'status-hint';

        tr.innerHTML = `
          <td>
            <div class="student-col">
              <div class="student-avatar">${s.avatar}</div>
              <strong>${s.name}</strong>
            </div>
          </td>
          <td>${s.quest}</td>
          <td>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${s.pct}%"></div>
            </div>
            <span>${s.pct}%</span>
          </td>
          <td>
            <span class="status-tag ${statusClass}">${s.statusText}</span>
          </td>
        `;
        tbodyStudents.appendChild(tr);
      });
    }
  }

  if (btnClass2a && btnClass4b) {
    btnClass2a.addEventListener('click', () => {
      btnClass2a.classList.add('active');
      btnClass4b.classList.remove('active');
      renderDashboardClass('2a');
    });

    btnClass4b.addEventListener('click', () => {
      btnClass4b.classList.add('active');
      btnClass2a.classList.remove('active');
      renderDashboardClass('4b');
    });

    // Initial render
    renderDashboardClass('2a');
  }

  // Dashboard Export Simulation
  const btnExportDash = document.getElementById('btn-export-dash');
  const dashToast = document.getElementById('dash-export-toast');

  if (btnExportDash) {
    btnExportDash.addEventListener('click', () => {
      btnExportDash.disabled = true;
      btnExportDash.innerHTML = 'Формирование отчета...';
      if (dashToast) dashToast.classList.add('show');

      setTimeout(() => {
        btnExportDash.disabled = false;
        btnExportDash.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Выгрузить сводный отчет для завуча (PDF/Excel)
        `;
        openMessengerLead('Завуч / Учитель', 'Запрос сводного отчета успеваемости для завуча', 'Класс 2-А / 4-Б');
      }, 1400);
    });
  }

  // ==========================================================================
  // 5. Curriculum Catalog & Accordion
  // ==========================================================================
  const curriculumData = {
    g12: {
      subjectText: 'Интеграция: Окружающий мир, Литературное чтение, Логика',
      lessons: [
        {
          num: 'Урок 01',
          title: 'Что умеет робот: отличие программы от живого существа',
          summary: 'Знакомство с алгоритмическим мышлением на примере интерактивных правил и команд.',
          goal: 'Понять разницу между естественным интеллектом и программным алгоритмом.',
          teacherPhrasing: '«Ребята, представьте, что робот не умеет думать сам — он выполняет только те команды, которые мы составили в правильном порядке».',
          task: 'Собрать пошаговый алгоритм утренних сборов в школу для робота-помощника.'
        },
        {
          num: 'Урок 02',
          title: 'Как компьютер распознает изображения: учим модель отличать кошку от собаки',
          summary: 'Первые шаги в компьютерном зрении: классификация объектов по ключевым признакам.',
          goal: 'Усвоить концепцию обучающей выборки (датасета) и признаков объекта.',
          teacherPhrasing: '«Давайте покажем нашему роботу 10 картинок кошек и объясним ему, что у них треугольные ушки и усы».',
          task: 'Интерактивная сортировка карточек с животными в обучающую модель AI Sana.'
        },
        {
          num: 'Урок 03',
          title: 'Голосовые помощники: как алгоритм слышит звуки и выполняет команды',
          summary: 'Основы распознавания речи и синтеза ответов в детских устройствах.',
          goal: 'Изучить перевод звуковой волны в текст и структуру команд.',
          teacherPhrasing: '«Почему Алиса или Сири понимают наш голос? Они делят фразу на звуки и ищут знакомые ключевые слова».',
          task: 'Создание аудио-команды для робота AI Sana с проверкой распознавания.'
        },
        {
          num: 'Урок 04',
          title: 'Первая аудиосказка: создаем иллюстрации и озвучку с помощью ИИ',
          summary: 'Творческий синтез литературы и генеративных технологий для младших классов.',
          goal: 'Научиться формулировать добрые сюжетные промпты и уважать цифровое авторство.',
          teacherPhrasing: '«Мы авторы этой сказки! ИИ помогает нам нарисовать то, что мы придумали своим воображением».',
          task: 'Генерация 3 иллюстраций к собственной сказке про космического кота.'
        }
      ]
    },
    g34: {
      subjectText: 'Интеграция: Информатика, Математика, Английский язык, Проектная деятельность',
      lessons: [
        {
          num: 'Урок 01',
          title: 'Архитектура нейросети простыми словами: веса, ошибки и обучение',
          summary: 'Наглядное понимание того, как математические связи находят закономерности в данных.',
          goal: 'Развеять миф о «магии» ИИ и объяснить принцип минимизации ошибки.',
          teacherPhrasing: '«Нейросеть учится как ученик: пробует, ошибается, запоминает ошибку и с каждым разом делает точнее».',
          task: 'Визуальная настройка весов в интерактивной мини-модели распознавания цифр.'
        },
        {
          num: 'Урок 02',
          title: 'Искусство точного промпта: почему ИИ отвечает именно так',
          summary: 'Формирование критического мышления и культуры точных текстовых инструкций.',
          goal: 'Освоить структуру эффективного запроса: Роль + Контекст + Ограничения.',
          teacherPhrasing: '«Если задать вопрос небрежно, мы получим случайный ответ. Давайте научимся задавать вопросы точно».',
          task: 'Сравнение ответов ИИ на размытый и детализированный инженерный промпт.'
        },
        {
          num: 'Урок 03',
          title: 'Логические ветвления: диалоговый бот для школьной библиотеки',
          summary: 'Построение логики условий ЕСЛИ/ИНАЧЕ в диалоговых сценариях.',
          goal: 'Собрать рабочего чат-бота, умеющего рекомендовать книги по жанрам.',
          teacherPhrasing: '«ЕСЛИ читатель любит приключения, ТО рекомендуем Жюля Верна, ИНАЧЕ спрашиваем про космос».',
          task: 'Конструирование дерева диалога на визуальной блок-схеме платформы.'
        },
        {
          num: 'Урок 04',
          title: 'Фактчекинг и безопасность: как проверять нейросети на галлюцинации',
          summary: 'Цифровая гигиена и проверка фактов для исследователей 3–4 классов.',
          goal: 'Уметь отличать сгенерированные выдумки от научных фактов и проверять первоисточники.',
          teacherPhrasing: '«ИИ может красиво фантазировать и ошибаться. Задача человека — быть главным редактором и экспертом».',
          task: 'Поиск 3 фактических ошибок в сгенерированной исторической справке.'
        }
      ]
    }
  };

  const btnG12 = document.getElementById('btn-curriculum-g12');
  const btnG34 = document.getElementById('btn-curriculum-g34');
  const curriculumTag = document.getElementById('curriculum-subject-tag');
  const lessonGrid = document.getElementById('lesson-cards-grid');

  function renderCurriculum(gradeKey) {
    const data = curriculumData[gradeKey];
    if (!data || !lessonGrid) return;

    if (curriculumTag) curriculumTag.textContent = data.subjectText;
    lessonGrid.innerHTML = '';

    data.lessons.forEach((l, idx) => {
      const card = document.createElement('div');
      card.className = 'lesson-card';
      if (idx === 0) card.classList.add('expanded'); // first lesson open by default

      card.innerHTML = `
        <div class="lesson-card-header">
          <span class="lesson-number">${l.num}</span>
          <span style="font-size: 13px; color: var(--brand-accent); font-weight: 600;">Нажмите, чтобы развернуть ↓</span>
        </div>
        <h3 class="lesson-title">${l.title}</h3>
        <p class="lesson-summary">${l.summary}</p>
        <div class="lesson-accordion-content">
          <div class="accordion-row">
            <span class="accordion-label">🎯 Цель урока:</span>
            <span>${l.goal}</span>
          </div>
          <div class="accordion-row">
            <span class="accordion-label">🗣 Речевые формулировки для учителя:</span>
            <span style="font-style: italic; color: var(--brand-primary);">${l.teacherPhrasing}</span>
          </div>
          <div class="accordion-row">
            <span class="accordion-label">💻 Практическое задание ученика:</span>
            <span>${l.task}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      lessonGrid.appendChild(card);
    });
  }

  if (btnG12 && btnG34) {
    btnG12.addEventListener('click', () => {
      btnG12.classList.add('active');
      btnG34.classList.remove('active');
      renderCurriculum('g12');
    });

    btnG34.addEventListener('click', () => {
      btnG34.classList.add('active');
      btnG12.classList.remove('active');
      renderCurriculum('g34');
    });

    // Initial render
    renderCurriculum('g12');
  }

  // Download Sample Lesson Button
  const btnDownloadSample = document.getElementById('btn-download-sample-lesson');
  if (btnDownloadSample) {
    btnDownloadSample.addEventListener('click', () => {
      openMessengerLead('Учитель / Завуч', 'Скачивание методического плана урока №1 (PDF)', '1–4 классы');
    });
  }

  // ==========================================================================
  // 6. Showcase Micro-Demos
  // ==========================================================================
  // Demo 1: Space Story
  const btnStoryMars = document.getElementById('btn-story-mars');
  const btnStoryMoon = document.getElementById('btn-story-moon');
  const storyText = document.getElementById('story-text-content');
  const storyArt = document.getElementById('story-art-preview');

  if (btnStoryMars && btnStoryMoon && storyText) {
    btnStoryMars.addEventListener('click', () => {
      btnStoryMars.classList.add('active');
      btnStoryMoon.classList.remove('active');
      storyText.textContent = '«Корабль взял курс на Красную планету! ИИ-штурман обнаружил на Марсе кристаллы чистой энергии и построил базу исследователей...»';
      if (storyArt) {
        storyArt.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M14.5 9.5a2 2 0 1 0-2-2"></path>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          </svg>
        `;
      }
    });

    btnStoryMoon.addEventListener('click', () => {
      btnStoryMoon.classList.add('active');
      btnStoryMars.classList.remove('active');
      storyText.textContent = '«Капитан Барсик приземлился в Море Спокойствия. Здесь лунные зайцы попросили нейросеть расшифровать древние звездные карты...»';
      if (storyArt) {
        storyArt.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      }
    });
  }

  // Demo 2: Animal Classifier
  const visionBtns = document.querySelectorAll('.vision-btn');
  const visionScanBar = document.getElementById('vision-scan-bar');
  const visionAnimalIcon = document.getElementById('vision-animal-icon');
  const visionResultTag = document.getElementById('vision-result-tag');

  const animalMap = {
    dog: { icon: '🐶', label: 'Определено 99.4%: Собака домашняя' },
    cat: { icon: '🐱', label: 'Определено 98.9%: Кот сибирский' },
    panda: { icon: '🐼', label: 'Определено 99.2%: Панда бамбуковая' }
  };

  visionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      visionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const animal = btn.getAttribute('data-animal');
      const data = animalMap[animal];

      if (visionScanBar) visionScanBar.classList.add('scanning');
      if (visionResultTag) visionResultTag.textContent = 'Сканирование признаков нейросетью...';

      setTimeout(() => {
        if (visionScanBar) visionScanBar.classList.remove('scanning');
        if (visionAnimalIcon) visionAnimalIcon.textContent = data.icon;
        if (visionResultTag) visionResultTag.textContent = data.label;
      }, 550);
    });
  });

  // Demo 3: School Chatbot
  const chatBubbleUser = document.getElementById('chat-bubble-user');
  const chatBubbleBot = document.getElementById('chat-bubble-bot');
  const chatChips = document.querySelectorAll('.chat-chip-btn');

  const chatAnswers = {
    math: {
      q: 'Что задали по математике?',
      a: 'Учебник страница 42, номер 4 и 5: составление логических цепочек и умножение!'
    },
    physics: {
      q: 'Кто открыл закон тяготения?',
      a: 'Исаак Ньютон! Легенда гласит, что на него упало спелое яблоко 🍎'
    },
    fact: {
      q: 'Расскажи научный факт',
      a: 'Скорость света — около 300 000 км в секунду! Луч от Солнца до Земли долетает всего за 8 минут ☀️'
    }
  };

  chatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const qKey = chip.getAttribute('data-q');
      const qa = chatAnswers[qKey];
      if (!qa) return;

      if (chatBubbleUser) chatBubbleUser.textContent = qa.q;
      if (chatBubbleBot) {
        chatBubbleBot.textContent = 'Печатает...';
        setTimeout(() => {
          chatBubbleBot.textContent = qa.a;
        }, 350);
      }
    });
  });

  // ==========================================================================
  // 7. Interactive School License Calculator
  // ==========================================================================
  const sliderClasses = document.getElementById('calc-slider-classes');
  const sliderStudents = document.getElementById('calc-slider-students');
  const valClasses = document.getElementById('calc-classes-val');
  const valStudents = document.getElementById('calc-students-val');
  const btnPeriodHalf = document.getElementById('calc-period-half');
  const btnPeriodYear = document.getElementById('calc-period-year');
  const outPriceStudent = document.getElementById('calc-price-per-student');
  const outTotalPeriod = document.getElementById('calc-total-period');
  const btnCalcKp = document.getElementById('btn-calc-kp');

  let currentPeriod = 'year'; // 'half' (5 months) or 'year' (9 months, 20% off)

  function formatMoney(num) {
    return num.toLocaleString('ru-RU') + ' ₸';
  }

  function updateCalculator() {
    const classesCount = parseInt(sliderClasses.value, 10);
    const studentsCount = parseInt(sliderStudents.value, 10);

    if (valClasses) valClasses.textContent = `${classesCount} ${classesCount === 1 ? 'класс' : classesCount < 5 ? 'класса' : 'классов'}`;
    if (valStudents) valStudents.textContent = `${studentsCount} детей`;

    // Base volume tiered pricing per student/mo
    let baseRate = 1500;
    if (classesCount >= 4 || studentsCount >= 100) {
      baseRate = 1200;
    }
    if (classesCount >= 8 || studentsCount >= 220) {
      baseRate = 980;
    }

    let finalRate = baseRate;
    let months = 9;

    if (currentPeriod === 'half') {
      months = 5;
    } else {
      // 20% discount on full academic year
      finalRate = Math.round(baseRate * 0.8);
      months = 9;
    }

    const totalPeriodCost = studentsCount * finalRate * months;

    if (outPriceStudent) outPriceStudent.textContent = formatMoney(finalRate);
    if (outTotalPeriod) outTotalPeriod.textContent = formatMoney(totalPeriodCost);
  }

  if (sliderClasses) sliderClasses.addEventListener('input', updateCalculator);
  if (sliderStudents) sliderStudents.addEventListener('input', updateCalculator);

  if (btnPeriodHalf && btnPeriodYear) {
    btnPeriodHalf.addEventListener('click', () => {
      btnPeriodHalf.classList.add('active');
      btnPeriodYear.classList.remove('active');
      currentPeriod = 'half';
      updateCalculator();
    });

    btnPeriodYear.addEventListener('click', () => {
      btnPeriodYear.classList.add('active');
      btnPeriodHalf.classList.remove('active');
      currentPeriod = 'year';
      updateCalculator();
    });

    updateCalculator();
  }

  if (btnCalcKp) {
    btnCalcKp.addEventListener('click', () => {
      const cls = sliderClasses.value;
      const std = sliderStudents.value;
      const per = currentPeriod === 'year' ? 'Полный учебный год (со скидкой 20%)' : 'Полгода';
      const details = `${cls} классов, ${std} учеников, Период: ${per}`;
      openMessengerLead('Руководитель школы / Завуч', 'Запрос официального КП и расчета для бухгалтерии', details);
    });
  }

  // ==========================================================================
  // 8. FAQ Accordion
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const qBtn = item.querySelector('.faq-question');
    if (qBtn) {
      qBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(f => f.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  // ==========================================================================
  // 9. Final CTA Role Selector & Conversion Buttons
  // ==========================================================================
  const roleRadios = document.querySelectorAll('input[name="user_role"]');
  const roleLabels = document.querySelectorAll('.role-radio-label');
  const btnFinalWhatsapp = document.getElementById('btn-final-whatsapp');
  const btnFinalTelegram = document.getElementById('btn-final-telegram');

  function getSelectedRole() {
    const checked = document.querySelector('input[name="user_role"]:checked');
    return checked ? checked.value : 'Учитель';
  }

  roleRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      roleLabels.forEach(l => l.classList.remove('active'));
      if (radio.parentElement) radio.parentElement.classList.add('active');
    });
  });

  if (btnFinalWhatsapp) {
    btnFinalWhatsapp.addEventListener('click', () => {
      const role = getSelectedRole();
      openMessengerLead(role, 'Подключение пилота AI Sana для школы на 14 дней');
    });
  }

  if (btnFinalTelegram) {
    btnFinalTelegram.addEventListener('click', () => {
      const role = getSelectedRole();
      openTelegramLead(`pilot_${role}`);
    });
  }

  // Hero pilot CTA
  const btnHeroPilot = document.getElementById('btn-hero-pilot');
  if (btnHeroPilot) {
    btnHeroPilot.addEventListener('click', () => {
      openMessengerLead('Учитель / Руководитель школы', 'Подключение бесплатного пилота на 1 класс на 14 дней');
    });
  }

  // Mobile sticky button
  const btnMobileWhatsapp = document.getElementById('btn-mobile-whatsapp');
  if (btnMobileWhatsapp) {
    btnMobileWhatsapp.addEventListener('click', () => {
      openMessengerLead('Гость мобильной версии', 'Консультация методиста');
    });
  }

  // Download Parent Guide CTA
  const btnDownloadParentGuide = document.getElementById('btn-download-parent-guide');
  if (btnDownloadParentGuide) {
    btnDownloadParentGuide.addEventListener('click', () => {
      openMessengerLead('Родитель', 'Скачивание памятки безопасности ИИ для детей 7-10 лет (PDF)');
    });
  }

  // Home demo quest CTA
  const btnHomeDemoQuest = document.getElementById('btn-home-demo-quest');
  if (btnHomeDemoQuest) {
    btnHomeDemoQuest.addEventListener('click', () => {
      openMessengerLead('Родитель', 'Демо-квест домашнего обучения AI Sana');
    });
  }

  // ==========================================================================
  // 10. Modals Management (Pilot Request & Teacher Login)
  // ==========================================================================
  const modalPilot = document.getElementById('modal-pilot');
  const btnClosePilot = document.getElementById('btn-close-pilot-modal');
  const openPilotBtns = document.querySelectorAll('.open-pilot-modal-btn');
  const pilotForm = document.getElementById('pilot-request-form');

  const modalTeacherLogin = document.getElementById('modal-teacher-login');
  const btnOpenTeacherModal = document.getElementById('btn-open-teacher-modal');
  const btnCloseTeacherModal = document.getElementById('btn-close-login-modal');
  const btnSubmitTeacherLogin = document.getElementById('btn-submit-teacher-login');

  function openModal(m) {
    if (m) m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(m) {
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  }

  openPilotBtns.forEach(btn => {
    btn.addEventListener('click', () => openModal(modalPilot));
  });

  if (btnClosePilot) btnClosePilot.addEventListener('click', () => closeModal(modalPilot));
  if (btnOpenTeacherModal) btnOpenTeacherModal.addEventListener('click', () => openModal(modalTeacherLogin));
  if (btnCloseTeacherModal) btnCloseTeacherModal.addEventListener('click', () => closeModal(modalTeacherLogin));

  [modalPilot, modalTeacherLogin].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(modalPilot);
      closeModal(modalTeacherLogin);
    }
  });

  if (pilotForm) {
    pilotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = document.getElementById('pilot-role-select').value;
      const school = document.getElementById('pilot-school-name').value;
      const contact = document.getElementById('pilot-contact').value;
      closeModal(modalPilot);
      openMessengerLead(role, 'Заявка на 14-дневный пилот из формы', `Школа: ${school}, Контакт: ${contact}`);
    });
  }

  if (btnSubmitTeacherLogin) {
    btnSubmitTeacherLogin.addEventListener('click', () => {
      closeModal(modalTeacherLogin);
      const dashEl = document.getElementById('dashboard');
      if (dashEl) {
        dashEl.scrollIntoView({ behavior: 'smooth' });
      }
      alert('Успешный вход! Вы находитесь в интерактивном кабинете учителя 2-А класса.');
    });
  }

  // ==========================================================================
  // 11. Header Scroll Effect & Mobile Menu
  // ==========================================================================
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header && header.classList.add('scrolled');
    } else {
      header && header.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navDropdownBtn = document.getElementById('nav-schools-dropdown-btn');
  const navItemDropdown = document.querySelector('.nav-item.has-dropdown');

  if (navDropdownBtn && navItemDropdown) {
    navDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navItemDropdown.classList.contains('open');
      navItemDropdown.classList.toggle('open');
      navDropdownBtn.setAttribute('aria-expanded', !isOpen);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!navItemDropdown.contains(e.target)) {
        navItemDropdown.classList.remove('open');
        navDropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close dropdown when any item inside is clicked
    const dropdownItems = navItemDropdown.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        navItemDropdown.classList.remove('open');
        navDropdownBtn.setAttribute('aria-expanded', 'false');
        const navLinks = document.querySelector('.nav-links');
        if (window.innerWidth <= 768 && navLinks) {
          navLinks.style.display = 'none';
        }
      });
    });
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        const isShown = navLinks.style.display === 'flex';
        navLinks.style.display = isShown ? 'none' : 'flex';
        if (!isShown) {
          navLinks.style.flexDirection = 'column';
          navLinks.style.position = 'absolute';
          navLinks.style.top = 'var(--header-height)';
          navLinks.style.left = '0';
          navLinks.style.right = '0';
          navLinks.style.backgroundColor = '#ffffff';
          navLinks.style.padding = '20px';
          navLinks.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        }
      }
    });

    // Close mobile nav when clicking regular links
    document.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        if (window.innerWidth <= 768 && navLinks) {
          navLinks.style.display = 'none';
        }
      });
    });
  }

  // ==========================================================================
  // 12. Multi-Language Switcher Controller
  // ==========================================================================
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (window.AISanaI18n) {
        window.AISanaI18n.setLanguage(lang);
      }
    });
  });

  // Re-render dynamic elements when language changes
  window.addEventListener('aisana:langchange', () => {
    updateCalculator();
  });

});
