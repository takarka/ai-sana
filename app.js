// PISA AI Platform — Interactive Core Logic & Components

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initLanguageSwitcher();
  initHeroMockup();
  initPlayground();
  initTeacherDashboard();
  initAiSimulator();
  initRoleTabs();
  initAnimatedCounters();
  initFaqAccordion();
  initModals();
  initMobileMenu();
});

/* ==========================================================================
   0. THEME TOGGLE (DARK / LIGHT MODE)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  // Determine initial theme
  let savedTheme = localStorage.getItem("pisa_theme");
  if (!savedTheme) {
    savedTheme = "dark"; // Default theme
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pisa_theme", theme);

    if (themeIcon) {
      if (theme === "light") {
        themeIcon.className = "ph-bold ph-moon";
        toggleBtn.setAttribute("title", "Включить темную тему");
      } else {
        themeIcon.className = "ph-bold ph-sun";
        toggleBtn.setAttribute("title", "Включить светлую тему");
      }
    }

    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
  }

  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }
}

/* ==========================================================================
   1. LANGUAGE SWITCHER INITIALIZATION
   ========================================================================== */
function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll(".lang-btn");
  langBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetLang = btn.getAttribute("data-lang");
      if (window.setLanguage) {
        window.setLanguage(targetLang);
      }
    });
  });

  // Apply saved language on boot
  if (window.setLanguage && window.getCurrentLang) {
    window.setLanguage(window.getCurrentLang());
  }
}

/* ==========================================================================
   2. HERO MOCKUP INTERACTIVITY
   ========================================================================== */
function initHeroMockup() {
  const mockupCard = document.querySelector(".mockup-window");
  if (!mockupCard) return;

  // Subtle 3D tilt on mouse movement over hero
  const heroWrapper = document.querySelector(".hero-mockup-wrapper");
  if (heroWrapper) {
    heroWrapper.addEventListener("mousemove", (e) => {
      const rect = heroWrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mockupCard.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
    });
    heroWrapper.addEventListener("mouseleave", () => {
      mockupCard.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)";
    });
  }
}

/* ==========================================================================
   3. INTERACTIVE PISA TASK PLAYGROUND
   ========================================================================== */
const playgroundTasks = {
  math: {
    ru: {
      tag: "Математическая грамотность · Уровень 4",
      title: "Анализ ветровой электростанции",
      scenario: "Ветровая турбина начинает вырабатывать энергию при скорости ветра 4 м/с и достигает номинальной мощности 2.5 МВт при 12 м/с. В течение суток скорость ветра составляла: 6 часов — 2 м/с, 10 часов — 8 м/с (мощность 1.2 МВт), 8 часов — 14 м/с (мощность 2.5 МВт). Сколько всего МВт·ч энергии было выработано за сутки?",
      options: [
        "A) 24.8 МВт·ч",
        "B) 32.0 МВт·ч (10×1.2 + 8×2.5 = 12 + 20)",
        "C) 38.4 МВт·ч",
        "D) 18.2 МВт·ч"
      ],
      correctIndex: 1,
      hint: "Подсказка AI: Помните, что в первые 6 часов скорость ветра была 2 м/с (ниже 4 м/с), поэтому выработка была 0 МВт. Сложите энергию за оставшиеся 10 часов и 8 часов.",
      explanationCorrect: "Блестяще! Вы правильно учли критический порог запуска турбины (0 МВт при <4 м/с) и перемножили часы на мощность: (10 × 1.2) + (8 × 2.5) = 12 + 20 = 32.0 МВт·ч.",
      explanationWrong: "Не совсем точно. Проверьте: учитывали ли вы первые 6 часов? При скорости 2 м/с турбина стоит (0 МВт). Сложите только выработку на этапах 8 м/с и 14 м/с."
    },
    kz: {
      tag: "Математикалық сауаттылық · 4-деңгей",
      title: "Жел электр станциясын талдау",
      scenario: "Жел турбинасы жел жылдамдығы 4 м/с болғанда энергия өндіре бастайды және 12 м/с-те 2.5 МВт номиналды қуатқа жетеді. Тәулік бойы жел жылдамдығы: 6 сағат — 2 м/с, 10 сағат — 8 м/с (қуаты 1.2 МВт), 8 сағат — 14 м/с (қуаты 2.5 МВт) болды. Тәулік ішінде барлығы қанша МВт·сағ энергия өндірілді?",
      options: [
        "A) 24.8 МВт·сағ",
        "B) 32.0 МВт·сағ (10×1.2 + 8×2.5 = 12 + 20)",
        "C) 38.4 МВт·сағ",
        "D) 18.2 МВт·сағ"
      ],
      correctIndex: 1,
      hint: "AI тұспалы: Алғашқы 6 сағатта жел 2 м/с (4 м/с-тен аз) болғанын ескеріңіз, сондықтан өндіріс 0 МВт. Қалған 10 сағат пен 8 сағаттың энергиясын қосыңыз.",
      explanationCorrect: "Өте тамаша! Сіз турбинаның іске қосылу шегін дұрыс есепке алдыңыз және қуатты уақытқа көбейттіңіз: (10 × 1.2) + (8 × 2.5) = 12 + 20 = 32.0 МВт·сағ.",
      explanationWrong: "Қайта тексеріңіз. 2 м/с желде турбина жұмыс істемейді (0 МВт). Тек 8 м/с және 14 м/с кезеңдеріндегі энергияны есептеп қосыңыз."
    }
  },
  science: {
    ru: {
      tag: "Естественно-научная грамотность · Уровень 3",
      title: "Эксперимент с парниковым эффектом",
      scenario: "Ученики поместили два одинаковых закрытых стеклянных сосуда под лампу накаливания. В сосуд А закачали обычный воздух, а в сосуд Б — воздух с повышенной концентрацией CO₂. Спустя 30 минут температура в сосуде Б оказалась на 4.2°C выше. Какой вывод научно обоснован?",
      options: [
        "A) Стекло поглощает больше света, если внутри углекислый газ",
        "B) Углекислый газ задерживает инфракрасное (тепловое) излучение эффективнее чистого воздуха",
        "C) Лампа нагревала сосуд Б сильнее из-за изменения давления",
        "D) CO₂ сам по себе выделяет тепло в ходе экзотермической реакции"
      ],
      correctIndex: 1,
      hint: "Подсказка AI: Вспомните физический механизм парникового эффекта: газы пропускают видимый свет, но поглощают переизлученное инфракрасное (тепловое) излучение.",
      explanationCorrect: "Абсолютно верно! Это классический механизм парникового эффекта в естествознании PISA: молекулы CO₂ поглощают и рассеивают инфракрасное излучение, задерживая тепловую энергию.",
      explanationWrong: "Этот вывод не согласуется с данными опыта. Стекло и лампа были одинаковыми, а реакций не происходило. Причина — поглощение длинноволнового теплового излучения углекислым газом."
    },
    kz: {
      tag: "Жаратылыстану-ғылыми сауаттылық · 3-деңгей",
      title: "Парниктік эффект эксперименті",
      scenario: "Оқушылар екі бірдей жабық шыны ыдысты қыздыру шамының астына қойды. А ыдысына кәдімгі ауа, ал Б ыдысына CO₂ концентрациясы жоғары ауа толтырылды. 30 минуттан соң Б ыдысындағы температура 4.2°C-қа жоғары болды. Қай тұжырым ғылыми тұрғыдан дұрыс?",
      options: [
        "A) Шыны көмірқышқыл газы бар кезде жарықты көбірек жұтады",
        "B) Көмірқышқыл газы инфрақызыл (жылулық) сәулеленуді таза ауаға қарағанда тиімдірек ұстайды",
        "C) Шам Б ыдысын қысымның өзгеруіне байланысты қаттырақ қыздырды",
        "D) CO₂ өздігінен экзотермиялық реакция арқылы жылу бөледі"
      ],
      correctIndex: 1,
      hint: "AI тұспалы: Парниктік эффектінің физикалық табиғатын еске түсіріңіз: газдар жарықты өткізеді, бірақ жылулық инфрақызыл сәулелерді жұтып, кері таратады.",
      explanationCorrect: "Дәл солай! Бұл PISA бағалауындағы негізгі ғылыми тұжырым: CO₂ молекулалары инфрақызыл сәулеленуді жұтып, жылуды сақтайды.",
      explanationWrong: "Ғылыми тұрғыдан қате. Шам мен ыдыстар бірдей болды. Негізгі себеп — көмірқышқыл газының жылу сәулелерін ұстап қалу қасиеті."
    }
  },
  reading: {
    ru: {
      tag: "Читательская грамотность · Уровень 4",
      title: "Критическая оценка научной статьи",
      scenario: "В отчете исследовательской группы сказано: «Хотя 74% опрошенных отметили улучшение самочувствия после перехода на новый режим дня, контрольная группа плацебо показала аналогичный прирост в 71% (разница статистически незначима, p > 0.05)». Автор научно-популярного блога написал заголовок: «Новый режим дня гарантированно оздоравливает организм на 74%». Какая критическая ошибка допущена в блоге?",
      options: [
        "A) Блогер перепутал проценты опрошенных с количеством участников",
        "B) Блогер проигнорировал результаты контрольной группы плацебо и статистическую незначимость эффекта",
        "C) Блогер не указал дату публикации отчета",
        "D) В оригинальном исследовании выборка была слишком маленькой"
      ],
      correctIndex: 1,
      hint: "Подсказка AI: Обратите внимание на сравнение с контрольной группой (74% против 71%) и ремарку «разница статистически незначима».",
      explanationCorrect: "Превосходно! В PISA читательская грамотность включает умение выявлять манипуляции с данными: автор блога выдал эффект плацебо за доказанное действие режима.",
      explanationWrong: "Обратите внимание на ключевой элемент научной методологии: наличие контрольной группы (71%) показывает, что эффект режима неотличим от случайности."
    },
    kz: {
      tag: "Оқу сауаттылығы · 4-деңгей",
      title: "Ғылыми мақаланы сыни бағалау",
      scenario: "Зерттеу есебінде былай делінген: «Жаңа күн тәртібіне көшкеннен кейін сауалнамаға қатысқандардың 74%-ы көңіл-күйінің жақсарғанын айтқанымен, плацебо бақылау тобында да 71% өсім байқалды (айырмашылық статистикалық тұрғыдан маңызды емес, p > 0.05)». Блог авторы: «Жаңа күн тәртібі ағзаны 74%-ға сауықтыратыны дәлелденді» деген тақырып қойды. Блогер қандай қателік жіберді?",
      options: [
        "A) Блогер қатысушылар саны мен пайызды шатастырды",
        "B) Блогер плацебо бақылау тобының нәтижесін және әсердің статистикалық маңызды еместігін ескермеді",
        "C) Блогер есептің жарияланған күнін көрсетпеді",
        "D) Түпнұсқа зерттеуде таңдама тым аз болды"
      ],
      correctIndex: 1,
      hint: "AI тұспалы: Бақылау тобымен салыстыруға (74% және 71%) және «айырмашылық статистикалық маңызды емес» деген ескертпеге назар аударыңыз.",
      explanationCorrect: "Өте дұрыс! PISA оқу сауаттылығы ақпаратты сыни тұрғыдан саралауды талап етеді: блогер бақылау тобындағы плацебо әсерін жасырып, жалған қорытынды жасаған.",
      explanationWrong: "Қайта ойланыңыз. Негізгі олқылық — бақылау тобының (71%) нәтижесін елемеу, бұл жаңа режимнің нақты артықшылығы жоқ екенін көрсетеді."
    }
  }
};

let currentSubject = "math";
let selectedOption = null;

function initPlayground() {
  const tabBtns = document.querySelectorAll(".pg-tab-btn");
  const optionsContainer = document.getElementById("pg-options-list");
  const hintBtn = document.getElementById("btn-pg-hint");
  const submitBtn = document.getElementById("btn-pg-submit");

  if (!optionsContainer) return;

  function renderPlayground() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";
    const task = playgroundTasks[currentSubject][lang];

    document.getElementById("pg-level-badge").textContent = task.tag;
    document.getElementById("pg-task-title").textContent = task.title;
    document.getElementById("pg-scenario-text").textContent = task.scenario;

    // Render options
    optionsContainer.innerHTML = "";
    selectedOption = null;

    task.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "pg-option-btn";
      btn.innerHTML = `
        <span class="pg-option-letter">${String.fromCharCode(65 + idx)}</span>
        <span>${optText}</span>
      `;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".pg-option-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedOption = idx;
      });
      optionsContainer.appendChild(btn);
    });

    // Reset feedback side
    const statusBadge = document.getElementById("pg-feedback-badge");
    const aiBubble = document.getElementById("pg-ai-feedback");
    statusBadge.className = "feedback-status-badge neutral";
    statusBadge.textContent = lang === "kz" ? "Жауапты күтуде" : "Ожидание ответа";
    aiBubble.textContent = lang === "kz" 
      ? "Нұсқалардың бірін таңдап, «Жауапты тексеру» батырмасын басыңыз немесе көмек қажет болса, AI тұспалын сұраңыз."
      : "Выберите вариант ответа и нажмите «Проверить ответ», или запросите подсказку AI, если задание кажется сложным.";
  }

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSubject = btn.getAttribute("data-subject");
      renderPlayground();
    });
  });

  // Hint button
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";
      const task = playgroundTasks[currentSubject][lang];
      const statusBadge = document.getElementById("pg-feedback-badge");
      const aiBubble = document.getElementById("pg-ai-feedback");

      statusBadge.className = "feedback-status-badge warning";
      statusBadge.textContent = lang === "kz" ? "AI тұспалы" : "Подсказка AI";
      aiBubble.textContent = task.hint;
    });
  }

  // Submit button
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";
      const task = playgroundTasks[currentSubject][lang];
      const statusBadge = document.getElementById("pg-feedback-badge");
      const aiBubble = document.getElementById("pg-ai-feedback");

      if (selectedOption === null) {
        alert(lang === "kz" ? "Алдымен жауап нұсқасын таңдаңыз!" : "Пожалуйста, выберите один из вариантов ответа!");
        return;
      }

      if (selectedOption === task.correctIndex) {
        statusBadge.className = "feedback-status-badge success";
        statusBadge.textContent = lang === "kz" ? "Дұрыс жауап" : "Верно!";
        aiBubble.textContent = task.explanationCorrect;

        // Fire festive confetti
        if (typeof confetti === "function") {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      } else {
        statusBadge.className = "feedback-status-badge warning";
        statusBadge.textContent = lang === "kz" ? "Қате жауап" : "Попробуйте еще раз";
        aiBubble.textContent = task.explanationWrong;
      }
    });
  }

  // Re-render when language changes
  window.addEventListener("languageChanged", renderPlayground);
  renderPlayground();
}

/* ==========================================================================
   4. TEACHER ANALYTICS DASHBOARD & CHART.JS
   ========================================================================== */
let teacherChartInstance = null;

const classData = {
  "9a": {
    labels: ["Моделирование", "Анализ данных", "Рассуждение", "Научный метод", "Критическое чтение"],
    labelsKz: ["Модельдеу", "Деректерді талдау", "Пайымдау", "Ғылыми әдіс", "Сыни оқу"],
    scores: [78, 64, 82, 71, 75],
    highPct: "25%",
    midPct: "50%",
    lowPct: "25%",
    recomRu: "8 учеников 9 «А» испытывают затруднения с интерпретацией графиков и таблиц. Рекомендуется провести практическую сессию по теме «Анализ данных в реальных контекстах».",
    recomKz: "9 «А» сыныбының 8 оқушысы қос диаграммаларды түсіндіруде қиналуда. «Нақты контекстегі деректерді талдау» тақырыбы бойынша сабақ ұсынылады."
  },
  "9b": {
    labels: ["Моделирование", "Анализ данных", "Рассуждение", "Научный метод", "Критическое чтение"],
    labelsKz: ["Модельдеу", "Деректерді талдау", "Пайымдау", "Ғылыми әдіс", "Сыни оқу"],
    scores: [68, 79, 70, 85, 62],
    highPct: "32%",
    midPct: "48%",
    lowPct: "20%",
    recomRu: "В 9 «Б» классе наблюдается дефицит навыков формулирования выводов в критическом чтении. Рекомендуется назначить модули по аргументации текстов.",
    recomKz: "9 «Б» сыныбында мәтінді сыни оқуда қорытынды жасау дағдыларының жетіспеушілігі бар. Мәтін аргументациясы бойынша модульдер ұсынылады."
  }
};

function initTeacherDashboard() {
  const ctx = document.getElementById("teacherAnalyticsChart");
  const classSelect = document.getElementById("dash-class-select");
  const subjectSelect = document.getElementById("dash-subject-select");

  if (!ctx || typeof Chart === "undefined") return;

  function updateDashboard() {
    const selectedClass = classSelect ? classSelect.value : "9a";
    const currentData = classData[selectedClass] || classData["9a"];
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";

    // Update stats boxes
    const highEl = document.getElementById("dash-val-high");
    const midEl = document.getElementById("dash-val-mid");
    const lowEl = document.getElementById("dash-val-low");
    const recomEl = document.getElementById("dash-ai-recom-text");

    if (highEl) highEl.textContent = currentData.highPct;
    if (midEl) midEl.textContent = currentData.midPct;
    if (lowEl) lowEl.textContent = currentData.lowPct;
    if (recomEl) recomEl.textContent = lang === "kz" ? currentData.recomKz : currentData.recomRu;

    // Update Chart
    const labels = lang === "kz" ? currentData.labelsKz : currentData.labels;
    const isLight = (document.documentElement.getAttribute("data-theme") === "light");
    const tickColor = isLight ? "#64748B" : "#94A3B8";
    const gridColor = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.05)";
    const tooltipBg = isLight ? "#FFFFFF" : "#141E34";
    const tooltipBorder = isLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";
    const tooltipTitle = isLight ? "#0F172A" : "#F8FAFC";
    const tooltipBody = isLight ? "#475569" : "#94A3B8";

    if (teacherChartInstance) {
      teacherChartInstance.data.labels = labels;
      teacherChartInstance.data.datasets[0].data = currentData.scores;
      teacherChartInstance.options.scales.x.ticks.color = tickColor;
      teacherChartInstance.options.scales.x.grid.color = gridColor;
      teacherChartInstance.options.scales.y.ticks.color = tickColor;
      teacherChartInstance.options.scales.y.grid.color = gridColor;
      teacherChartInstance.options.plugins.tooltip.backgroundColor = tooltipBg;
      teacherChartInstance.options.plugins.tooltip.borderColor = tooltipBorder;
      teacherChartInstance.options.plugins.tooltip.titleColor = tooltipTitle;
      teacherChartInstance.options.plugins.tooltip.bodyColor = tooltipBody;
      teacherChartInstance.update();
    } else {
      teacherChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Средний балл PISA (%)",
            data: currentData.scores,
            backgroundColor: "rgba(59, 130, 246, 0.65)",
            borderColor: "#3B82F6",
            borderWidth: 1.5,
            borderRadius: 6,
            hoverBackgroundColor: "#60A5FA"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 10,
              titleColor: tooltipTitle,
              bodyColor: tooltipBody
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: tickColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: { color: tickColor, callback: v => v + "%" }
            }
          }
        }
      });
    }
  }

  if (classSelect) classSelect.addEventListener("change", updateDashboard);
  if (subjectSelect) subjectSelect.addEventListener("change", updateDashboard);
  window.addEventListener("languageChanged", updateDashboard);
  window.addEventListener("themeChanged", updateDashboard);

  updateDashboard();
}

/* ==========================================================================
   5. AI SIMULATOR INTERACTIVE TESTER
   ========================================================================== */
function initAiSimulator() {
  const promptBtns = document.querySelectorAll(".sim-prompt-btn");
  const userMsg = document.getElementById("sim-user-msg");
  const aiMsg = document.getElementById("sim-ai-msg");

  const dialogues = {
    p1: {
      userRu: "Почему вода при замерзании расширяется, хотя другие вещества сжимаются?",
      aiRu: "Это удивительное свойство называют «аномалией воды». При замерзании молекулы H₂O выстраиваются в гексагональную кристаллическую решетку с просторными пустотами между ними. Из-за этого лед занимает больший объем и становится легче жидкой воды — именно поэтому лед плавает на поверхности озер и сохраняет жизнь рыбам зимой!",
      userKz: "Басқа заттар тарылса да, су қатқан кезде неліктен көлемі ұлғаяды?",
      aiKz: "Бұл құбылыс «судың аномалиясы» деп аталады. Мұзға айналу кезінде H₂O молекулалары арасында бос кеңістігі бар арнайы кристалл торын түзеді. Сондықтан мұздың көлемі артып, сұйық судан жеңіл болады — осы себепті мұз су бетіне қалқып шығып, көл түбіндегі балықтарды аяздан қорғайды!"
    },
    p2: {
      userRu: "Как определить основную идею сложного текста в задании PISA?",
      aiRu: "Используй стратегию трех фокусов: 1) Найди тезис во введении и выводе; 2) Сформулируй, с какой целью автор написал текст (убедить, проинформировать или поставить под сомнение); 3) Отдели фактические данные от оценочных суждений автора. Хочешь потренироваться на реальном кейсе?",
      userKz: "PISA оқу сауаттылығында күрделі мәтіннің негізгі идеясын қалай тез табуға болады?",
      aiKz: "Үш қадамдық әдісті қолдан: 1) Кіріспе мен қорытындыдағы басты ойды тап; 2) Автор бұл мәтінді қандай мақсатпен жазғанын анықта (сендіру, хабарлау немесе күмән тудыру); 3) Нақты деректер мен автордың жеке пікірін ажырат. Нақты мысалмен жаттығып көреміз бе?"
    },
    p3: {
      userRu: "В чем разница между средней скоростью и средним арифметическим скоростей?",
      aiRu: "Критическая ловушка тестов! Средняя скорость — это ВСЁ пройденное расстояние, деленное на ВСЁ затраченное время (S_общ / t_общ). Простое среднее арифметическое скоростей дает неверный ответ, если участки пути преодолевались за разное время.",
      userKz: "Орташа жылдамдық пен жылдамдықтардың арифметикалық ортасының айырмашылығы неде?",
      aiKz: "Тесттердегі өте жиі кездесетін тұзақ! Орташа жылдамдық — бұл БҮКІЛ жүрілген жолды БҮКІЛ кеткен уақытқа бөлу (S_жалпы / t_жалпы). Егер жол бөліктері әртүрлі уақытта жүрілсе, қарапайым арифметикалық ортаны табу қате жауапқа әкеледі."
    }
  };

  promptBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      promptBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-prompt");
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";

      if (dialogues[key]) {
        userMsg.textContent = lang === "kz" ? dialogues[key].userKz : dialogues[key].userRu;
        aiMsg.textContent = lang === "kz" ? dialogues[key].aiKz : dialogues[key].aiRu;
      }
    });
  });
}

/* ==========================================================================
   6. STAKEHOLDER ROLE TABS
   ========================================================================== */
function initRoleTabs() {
  const roleBtns = document.querySelectorAll(".role-tab-btn");
  const rolePanels = document.querySelectorAll(".role-content-box");

  roleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetRole = btn.getAttribute("data-role");
      roleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      rolePanels.forEach(panel => {
        if (panel.getAttribute("data-role-content") === targetRole) {
          panel.style.display = "grid";
        } else {
          panel.style.display = "none";
        }
      });
    });
  });
}

/* ==========================================================================
   7. ANIMATED NUMBERS / STATS COUNTER
   ========================================================================== */
function initAnimatedCounters() {
  const statNumbers = document.querySelectorAll(".stat-number");
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetValue = parseInt(el.getAttribute("data-count"), 10);
        const suffix = el.getAttribute("data-suffix") || "";
        let current = 0;
        const step = Math.ceil(targetValue / 40);

        const timer = setInterval(() => {
          current += step;
          if (current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
          }
          el.textContent = current.toLocaleString("ru-RU") + suffix;
        }, 30);

        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  statNumbers.forEach(num => observer.observe(num));
}

/* ==========================================================================
   8. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question");
    if (btn) {
      btn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach(i => i.classList.remove("active"));
        if (!isActive) {
          item.classList.add("active");
        }
      });
    }
  });
}

/* ==========================================================================
   9. MODALS MANAGEMENT
   ========================================================================== */
function initModals() {
  const demoModal = document.getElementById("demoModal");
  const diagModal = document.getElementById("diagModal");
  const openDemoBtns = document.querySelectorAll("[data-open-demo]");
  const openDiagBtns = document.querySelectorAll("[data-open-diag]");
  const closeBtns = document.querySelectorAll(".modal-close");

  function openModal(modal) {
    if (modal) modal.classList.add("active");
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove("active");
  }

  openDemoBtns.forEach(btn => btn.addEventListener("click", () => openModal(demoModal)));
  openDiagBtns.forEach(btn => btn.addEventListener("click", () => openModal(diagModal)));

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      closeModal(demoModal);
      closeModal(diagModal);
    });
  });

  // Close on outside click
  window.addEventListener("click", (e) => {
    if (e.target === demoModal) closeModal(demoModal);
    if (e.target === diagModal) closeModal(diagModal);
  });

  // Close on ESC key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(demoModal);
      closeModal(diagModal);
    }
  });

  // Form submit simulated action
  const demoForm = document.getElementById("schoolDemoForm");
  if (demoForm) {
    demoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "ru";
      alert(lang === "kz" 
        ? "Сіздің өтініміңіз сәтті қабылданды! Біздің әдіскер жақын арада хабарласады." 
        : "Ваша заявка принята! Методист платформы свяжется с вами в течение 24 часов.");
      demoForm.reset();
      closeModal(demoModal);
    });
  }
}

/* ==========================================================================
   10. MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.querySelector(".mobile-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      if (navLinks.style.display === "flex") {
        navLinks.style.display = "none";
      } else {
        navLinks.style.display = "flex";
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.top = "var(--nav-height)";
        navLinks.style.left = "0";
        navLinks.style.width = "100%";
        navLinks.style.background = "var(--bg-surface)";
        navLinks.style.padding = "24px";
        navLinks.style.borderBottom = "1px solid var(--border-subtle)";
        navLinks.style.gap = "16px";
      }
    });

    // Close menu when link is clicked
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = "none";
        }
      });
    });
  }
}
