// Application Controller for AI Academy & PISA Platform
// Connects WebGL 3D Scene, Bilingual Engine, Interactive Labs and Theming

import { WebGLHeroScene } from './webgl-scene.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize i18n
  if (window.initI18n) {
    window.initI18n();
  }
  initLanguageSwitcher();

  // 2. Initialize WebGL Scene
  initWebGL();

  // 3. Initialize Theme Toggle
  initTheme();

  // 4. Initialize Age Switcher Tabs
  initAgeTabs();

  // 5. Initialize Interactive Lab (Prompts & PISA)
  initInteractiveLab();

  // 6. Initialize Teacher Analytics Chart
  initTeacherChart();

  // 7. Initialize FAQ Accordion
  initFaq();

  // 8. Initialize Modals & Mobile Menu
  initModals();
});

/* ==========================================================================
   1. WEBGL HERO INITIALIZATION
   ========================================================================== */
function initWebGL() {
  try {
    window.academyWebGL = new WebGLHeroScene('hero-3d-viewport', 'bg-shader-canvas');

    // Handle 3D node click event to jump to relevant age tab
    window.addEventListener('nodeSelected', (e) => {
      const nodeId = e.detail.nodeId;
      if (nodeId === 'kids' || nodeId === 'middle' || nodeId === 'high') {
        activateAgeTab(nodeId);
        const coursesSection = document.getElementById('courses');
        if (coursesSection) {
          coursesSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (nodeId === 'pisa') {
        const pisaSection = document.getElementById('pisa');
        if (pisaSection) {
          pisaSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  } catch (err) {
    console.warn('WebGL Initialization skipped or fallback applied:', err);
  }
}

/* ==========================================================================
   1.1 LANGUAGE SWITCHER
   ========================================================================== */
function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLang = btn.getAttribute('data-lang');
      if (window.setLanguage) {
        window.setLanguage(targetLang);
      }
    });
  });
}

/* ==========================================================================
   2. THEME CONTROLLER (Dark / Light)
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  let savedTheme = localStorage.getItem('pisa_theme') || 'dark';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pisa_theme', theme);

    if (themeIcon) {
      if (theme === 'light') {
        themeIcon.className = 'ph-bold ph-moon';
        toggleBtn.setAttribute('title', 'Включить темную тему');
      } else {
        themeIcon.className = 'ph-bold ph-sun';
        toggleBtn.setAttribute('title', 'Включить светлую тему');
      }
    }

    // Notify WebGL Scene and Chart.js
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }
}

/* ==========================================================================
   3. AGE TABS SWITCHER (1–4, 5–8, 9–11)
   ========================================================================== */
function activateAgeTab(trackKey) {
  const tabBtns = document.querySelectorAll('.age-tab-btn');
  const tabPanes = document.querySelectorAll('.course-track-pane');

  tabBtns.forEach(btn => {
    const isTarget = btn.getAttribute('data-track') === trackKey;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === `pane-${trackKey}`);
  });
}

function initAgeTabs() {
  const tabBtns = document.querySelectorAll('.age-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      activateAgeTab(track);
    });
  });

  document.querySelectorAll('[data-select-track]').forEach(link => {
    link.addEventListener('click', () => {
      const track = link.getAttribute('data-select-track');
      if (track) {
        activateAgeTab(track);
      }
    });
  });
}

/* ==========================================================================
   4. INTERACTIVE LAB (Prompt Simulator & PISA Task)
   ========================================================================== */
function initInteractiveLab() {
  // Tab Switcher between Prompt Lab and PISA Task
  const labTabBtns = document.querySelectorAll('.lab-tab-btn');
  const labPanes = document.querySelectorAll('.lab-content-pane');

  labTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-lab-tab');
      labTabBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      labPanes.forEach(p => {
        p.classList.toggle('active', p.id === `pane-lab-${targetTab}`);
      });
    });
  });

  // 4.1 Prompt Simulator Logic
  const promptSelect = document.getElementById('promptSelect');
  const promptInput = document.getElementById('promptInput');
  const btnRunPrompt = document.getElementById('btnRunPrompt');
  const promptOutput = document.getElementById('promptOutputText');

  const templates = {
    tpl1: {
      promptRu: 'Действуй как дружелюбный учитель математики. Объясни, что такое дроби 1/2, 1/4 и 3/4 на примере разрезания большой пиццы для первоклассника.',
      promptKz: 'Мейірімді математика мұғалімі ретінде жауап бер. Үлкен пиццаны бөлу мысалында 1/2, 1/4 және 3/4 бөлшектерінің не екенін 1-сынып оқушысына қарапайым түсіндір.',
      outputRu: 'Привет! Представь, что мы только что испекли круглую горячую пиццу 🍕.<br><br>Если мы разрежем её ровно пополам и отдадим тебе один кусок — это <strong>1/2 (половина)</strong>.<br>А если разрежем на 4 одинаковых кусочка: 1 кусочек — это <strong>1/4</strong>, а 3 кусочка вместе — это <strong>3/4</strong>!<br><br>Цифра внизу (знаменатель) показывает, на сколько частей мы разрезали, а цифра вверху — сколько кусочков у тебя в руках. Просто правда?',
      outputKz: 'Сәлем! Елестетші, біз дөңгелек ыстық пицца пісірдік 🍕.<br><br>Егер оны қақ ортасынан екіге бөлсек, бір бөлігі — <strong>1/2 (жартысы)</strong> болады.<br>Ал егер бірдей 4 бөлікке бөлсек: 1 бөлігі — <strong>1/4</strong>, ал 3 бөлігі бірге — <strong>3/4</strong> болады!<br><br>Астындағы сан пиццаны неше бөлікке бөлгенімізді, ал үстіндегі сан қолыңда қанша бөлік барын білдіреді. Өте оңай, иә?'
    },
    tpl2: {
      promptRu: 'Ты AI-методист. Составь краткий план доклада по экологии на тему «Сортировка пластика в школах» с 3 проверяемыми фактами для 7 класса.',
      promptKz: 'Сен ЖИ-әдіскерсің. 7-сыныпқа арналған «Мектептерде пластикті сұрыптау» тақырыбында 3 нақты фактісі бар баяндама жоспарын жаса.',
      outputRu: '<strong>План доклада «Вторая жизнь пластика»:</strong><br>1. <em>Введение:</em> Почему пластик стал глобальным вызовом (Факт: обычная пластиковая бутылка разлагается до 450 лет).<br>2. <em>Сортировка в нашей школе:</em> Маркировки PET, HDPE и что мы можем сдавать.<br>3. <em>Круговая экономика:</em> Как из 25 бутылок делают теплую эко-флиску.<br>4. <em>Вывод и призыв к действию:</em> 3 правила чистого класса.',
      outputKz: '<strong>«Пластиктің екінші өмірі» баяндама жоспары:</strong><br>1. <em>Кіріспе:</em> Пластик неге ғаламдық мәселеге айналды (Факт: қарапайым бөтелке 450 жылға дейін шіриді).<br>2. <em>Біздің мектептегі сұрыптау:</em> PET, HDPE таңбалары және нені өткізуге болады.<br>3. <em>Қайта өңдеу:</em> 25 бөтелкеден қалай жылы флис киім жасалады.<br>4. <em>Қорытынды:</em> Таза сыныптың 3 ережесі.'
    },
    tpl3: {
      promptRu: 'Напиши компактный Python скрипт для вычисления средней температуры за неделю с выводом дня с максимальной температурой.',
      promptKz: 'Бір аптадағы орташа температураны және ең ыстық күнді анықтайтын шағын Python скриптін жаз.',
      outputRu: '<pre style="background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.82rem;"><code>temps = [18, 22, 25, 21, 19, 27, 24]\navg_temp = sum(temps) / len(temps)\nmax_temp = max(temps)\nprint(f"Средняя температура: {avg_temp:.1f}°C")\nprint(f"Максимальная температура: {max_temp}°C (День {temps.index(max_temp)+1})")</code></pre><br>Код лаконичен, использует стандартные функции Python <code>sum()</code> и <code>max()</code> без сторонних библиотек.',
      outputKz: '<pre style="background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.82rem;"><code>temps = [18, 22, 25, 21, 19, 27, 24]\navg_temp = sum(temps) / len(temps)\nmax_temp = max(temps)\nprint(f"Орташа температура: {avg_temp:.1f}°C")\nprint(f"Ең жоғарғы температура: {max_temp}°C ({temps.index(max_temp)+1}-күн)")</code></pre><br>Код таза әрі түсінікті, Python-ның дайын <code>sum()</code> және <code>max()</code> функцияларын қолданады.'
    }
  };

  if (promptSelect && promptInput) {
    promptSelect.addEventListener('change', () => {
      const selected = promptSelect.value;
      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';
      const tpl = templates[selected] || templates.tpl1;
      promptInput.value = lang === 'kz' ? tpl.promptKz : tpl.promptRu;
    });
  }

  if (btnRunPrompt && promptOutput) {
    btnRunPrompt.addEventListener('click', () => {
      btnRunPrompt.disabled = true;
      btnRunPrompt.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Обработка нейросетью...';
      promptOutput.style.opacity = '0.5';

      setTimeout(() => {
        const selected = promptSelect ? promptSelect.value : 'tpl1';
        const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';
        const tpl = templates[selected] || templates.tpl1;

        promptOutput.innerHTML = lang === 'kz' ? tpl.outputKz : tpl.outputRu;
        promptOutput.style.opacity = '1';

        btnRunPrompt.disabled = false;
        btnRunPrompt.innerHTML = '<i class="ph-bold ph-paper-plane-right"></i> Отправить в нейросеть';

        // Trigger WebGL 3D Synapse Pulse
        if (window.academyWebGL && window.academyWebGL.triggerSynapsePulse) {
          window.academyWebGL.triggerSynapsePulse(0x3B82F6);
        }

        // Trigger celebratory confetti
        if (window.confetti) {
          window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
      }, 650);
    });
  }

  // 4.2 PISA Case Simulator Logic
  const pisaOptions = document.querySelectorAll('.pg-option-item');
  const btnPisaSubmit = document.getElementById('btnPisaSubmit');
  const btnPisaHint = document.getElementById('btnPisaHint');
  const pisaBadge = document.getElementById('pisaFeedbackBadge');
  const pisaFeedback = document.getElementById('pisaFeedbackText');

  pisaOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      pisaOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  if (btnPisaHint && pisaFeedback) {
    btnPisaHint.addEventListener('click', () => {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';
      pisaFeedback.innerHTML = lang === 'kz'
        ? '💡 <strong>ЖИ-тәлімгердің көмегі:</strong> Қалақ ұзындығы — бұл шеңбердің радиусы <em>r</em>. Формула бойынша аудан <em>S = π·r²</em>. Егер <em>r</em> мәні 1.5 есе өссе, <em>r²</em> қанша есе өседі?'
        : '💡 <strong>Подсказка AI-тьютора:</strong> Длина лопасти — это радиус окружности <em>r</em>. По формуле ометаемая площадь <em>S = π·r²</em>. Если <em>r</em> увеличить в 1.5 раза, то во сколько раз увеличится <em>r²</em>? Вспомните: (1.5)² = ?';
    });
  }

  if (btnPisaSubmit && pisaFeedback && pisaBadge) {
    btnPisaSubmit.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="pisaOpt"]:checked');
      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';

      if (!selectedRadio) {
        alert(lang === 'kz' ? 'Алдымен жауап нұсқасын таңдаңыз' : 'Пожалуйста, выберите один из вариантов ответа');
        return;
      }

      const val = selectedRadio.value;
      if (val === 'b') {
        pisaBadge.className = 'feedback-status-badge correct';
        pisaBadge.textContent = lang === 'kz' ? '✓ Дұрыс шешім (4-деңгей)' : '✓ Абсолютно верно (PISA Уровень 4)';
        pisaFeedback.innerHTML = lang === 'kz'
          ? 'Тамаша логика! Энергия қалақтардың ауданына (S = π·r²) байланысты. Радиус 1.5 есе өскенде, аудан (1.5)² = 2.25 есе артады. Сіз нақты инженерлік заңдылықты дұрыс қолдандыңыз.'
          : 'Блестящее математическое моделирование! Энергия пропорциональна площади ометаемой окружности S = π·r². При увеличении радиуса в 1.5 раза площадь возрастает в (1.5)² = 2.25 раза. Вы точно применили формулу к реальной инженерной задаче!';

        if (window.confetti) {
          window.confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        }
        if (window.academyWebGL && window.academyWebGL.triggerSynapsePulse) {
          window.academyWebGL.triggerSynapsePulse(0x10B981);
        }
      } else {
        pisaBadge.className = 'feedback-status-badge incorrect';
        pisaBadge.textContent = lang === 'kz' ? 'Қате бар · Логиканы қайта қараңыз' : 'Не совсем точно · Разбор ошибки';
        pisaFeedback.innerHTML = lang === 'kz'
          ? 'Жауап дұрыс емес. Көпшілік қалақ 1.5 есе ұзарса, энергия да 1.5 есе өседі деп қателеседі. Бірақ энергия ұзындыққа емес, шеңбердің ауданына (радиустың квадратына) байланысты: 1.5² = 2.25!'
          : 'Типичная ловушка PISA! Кажется, что зависимость прямая (в 1.5 раза), но энергия зависит от <em>площади круга</em>, которая растет пропорционально <strong>квадрату</strong> радиуса: (1.5)² = 2.25 раза. Попробуйте еще раз!';

        if (window.academyWebGL && window.academyWebGL.triggerSynapsePulse) {
          window.academyWebGL.triggerSynapsePulse(0xEF4444);
        }
      }
    });
  }
}

/* ==========================================================================
   5. TEACHER ANALYTICS CHART (Chart.js)
   ========================================================================== */
let teacherChart = null;

function initTeacherChart() {
  const ctx = document.getElementById('teacherChartCanvas');
  if (!ctx || !window.Chart) return;

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const textColor = isLight ? '#475569' : '#94A3B8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

  teacherChart = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Промптинг', 'AI-логика', 'Моделирование', 'Научный метод', 'Критическое чтение', 'Python основы'],
      datasets: [
        {
          label: 'Успеваемость класса (%)',
          data: [92, 86, 70, 78, 88, 82],
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(16, 185, 129, 0.85)'
          ],
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? '#FFFFFF' : '#0E1526',
          titleColor: isLight ? '#0F172A' : '#F8FAFC',
          bodyColor: isLight ? '#475569' : '#94A3B8',
          borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif" } }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: (val) => `${val}%`,
            font: { family: "'Plus Jakarta Sans', sans-serif" }
          }
        }
      }
    }
  });

  // Re-theme Chart on theme toggle
  window.addEventListener('themeChanged', (e) => {
    if (!teacherChart) return;
    const isNowLight = e.detail.theme === 'light';
    const newTextColor = isNowLight ? '#475569' : '#94A3B8';
    const newGridColor = isNowLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';

    teacherChart.options.scales.x.ticks.color = newTextColor;
    teacherChart.options.scales.y.ticks.color = newTextColor;
    teacherChart.options.scales.y.grid.color = newGridColor;
    teacherChart.update();
  });
}

/* ==========================================================================
   6. FAQ ACCORDION
   ========================================================================== */
function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   7. MODALS & FORMS
   ========================================================================== */
function initModals() {
  const demoModal = document.getElementById('demoModal');
  const diagModal = document.getElementById('diagModal');

  // Open triggers
  document.querySelectorAll('.open-demo-btn, #btnHeaderDemo').forEach(btn => {
    btn.addEventListener('click', () => {
      if (demoModal) demoModal.classList.add('open');
    });
  });

  document.querySelectorAll('.open-diag-btn, #btnHeaderCta').forEach(btn => {
    btn.addEventListener('click', () => {
      if (diagModal) diagModal.classList.add('open');
    });
  });

  // Close triggers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (demoModal) demoModal.classList.remove('open');
      if (diagModal) diagModal.classList.remove('open');
    });
  });

  // Close on backdrop click
  [demoModal, diagModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('open');
      });
    }
  });

  // Demo Form Submit
  const demoForm = document.getElementById('schoolDemoForm');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ru';
      alert(lang === 'kz' ? 'Өтінішіңіз қабылданды! Біз жақын арада хабарласамыз.' : 'Заявка успешно отправлена! Мы свяжемся с вами в течение 1 рабочего дня.');
      if (demoModal) demoModal.classList.remove('open');
      demoForm.reset();
    });
  }

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = window.getComputedStyle(navLinks).display !== 'none';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '72px';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'var(--bg-surface)';
      navLinks.style.padding = '20px';
      navLinks.style.borderBottom = '1px solid var(--border-subtle)';
    });
  }
}
