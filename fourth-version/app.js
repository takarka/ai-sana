// ==========================================================================
// AI ACADEMY (FOURTH VERSION) - APPLICATION JAVASCRIPT
// Interactive Engine: Node Graphs, Prompt Lab, Bento Cockpit, Flywheel & Modals
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initLanguageSwitcher();
  initHeroGraph();
  initPromptLab();
  initStudentTracks();
  initTeacherBento();
  initFaqAccordion();
  initStatCounters();
  initModal();
});

// --- 1. Language Switcher ---
function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll(".lang-btn");
  langBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (typeof setLanguage === "function") {
        setLanguage(lang);
      }
    });
  });
}

// --- 2. Hero Interactive Node Graph ---
function initHeroGraph() {
  const svg = document.getElementById("heroGraphSvg");
  const nodes = document.querySelectorAll(".graph-node");
  if (!svg || nodes.length === 0) return;

  function updateGraphCurves() {
    const centerNode = document.querySelector(".graph-node-center");
    if (!centerNode) return;

    const wrapRect = svg.parentElement.getBoundingClientRect();
    const centerRect = centerNode.getBoundingClientRect();

    const cx = centerRect.left + centerRect.width / 2 - wrapRect.left;
    const cy = centerRect.top + centerRect.height / 2 - wrapRect.top;

    svg.innerHTML = "";

    nodes.forEach((node, idx) => {
      if (node.classList.contains("graph-node-center")) return;

      const nodeRect = node.getBoundingClientRect();
      const nx = nodeRect.left + nodeRect.width / 2 - wrapRect.left;
      const ny = nodeRect.top + nodeRect.height / 2 - wrapRect.top;

      // Arc curved bezier control point
      const midX = (cx + nx) / 2;
      const midY = (cy + ny) / 2 - 30;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${cx} ${cy} Q ${midX} ${midY} ${nx} ${ny}`);
      path.setAttribute("class", "graph-arc-path");
      path.setAttribute("id", `arcPath-${idx}`);
      svg.appendChild(path);

      // Node hover interaction
      node.addEventListener("mouseenter", () => {
        path.classList.add("active");
        node.classList.add("active");
      });
      node.addEventListener("mouseleave", () => {
        path.classList.remove("active");
        node.classList.remove("active");
      });
    });
  }

  // Draw curves after initial layout
  setTimeout(updateGraphCurves, 200);
  window.addEventListener("resize", updateGraphCurves);
}

// --- 3. Prompt Lab Simulator ---
function initPromptLab() {
  const tabBad = document.getElementById("promptTabBad");
  const tabGood = document.getElementById("promptTabGood");
  const inputEl = document.getElementById("promptInputBox");
  const resultBox = document.getElementById("promptResultBox");
  const resultText = document.getElementById("promptResultText");
  const critiqueEl = document.getElementById("promptCritiqueBox");

  if (!tabBad || !tabGood || !inputEl) return;

  tabBad.addEventListener("click", () => {
    tabBad.classList.add("active");
    tabGood.classList.remove("active", "btn-good");

    inputEl.textContent = (currentLang === "kz")
      ? "«Физика сабағына Марс туралы бірдеңе жаз»"
      : "«Напиши что-нибудь про Марс для урока физики»";

    resultBox.className = "prompt-result-mock";
    resultText.textContent = (currentLang === "kz")
      ? "Марс — төртінші ғаламшар. Онда суық және кратерлер бар. Атмосферасы көмірқышқыл газынан тұрады..."
      : "Марс — четвертая планета. Там холодно и есть кратеры. Атмосфера состоит из углекислого газа...";

    critiqueEl.className = "prompt-critique critique-bad";
    critiqueEl.textContent = (currentLang === "kz")
      ? "⚠ Үстірт мәтін, нақты ғылыми дәйектердің жоқтығы, көшіріп алу қаупі."
      : "⚠ Поверхностный текст, отсутствие научных фактов, риск слепого копирования.";
  });

  tabGood.addEventListener("click", () => {
    tabGood.classList.add("active", "btn-good");
    tabBad.classList.remove("active");

    inputEl.textContent = (currentLang === "kz")
      ? "«Рөл: астрофизик. 7-сынып оқушысына неге Марстағы гравитация Жердегіден әлсіз екенін түсіндір, F = G*(m1*m2)/r^2 формуласын келтір және 50 кг адамның салмағын Жер мен Марста кесте түрінде салыстыр.»"
      : "«Роль: астрофизик. Объясни ученику 7 класса, почему гравитация на Марсе слабее земной, приведи формулу F = G*(m1*m2)/r^2 и сравни вес человека 50 кг на Земле и Марсе в виде таблицы.»";

    resultBox.className = "prompt-result-mock good-result";
    resultText.textContent = (currentLang === "kz")
      ? "Дәл есептеу: Марста еркін түсу үдеуі g ≈ 3.71 м/с² (Жерде 9.8 м/с²). Салмағы 50 кг адам Марста 18.9 кг болып сезіледі! Салыстыру кестесі дайын."
      : "Точный расчет: на Марсе ускорение свободного падения g ≈ 3.71 м/с² против 9.8 м/с² на Земле. Человек весом 50 кг на Марсе будет весить эквивалентно 18.9 кг! Таблица сравнения сформирована.";

    critiqueEl.className = "prompt-critique critique-good";
    critiqueEl.textContent = (currentLang === "kz")
      ? "✓ Нақты параметрлер, ғылыми дәлдік, формулалармен жұмыс және пәнді шынайы түсіну!"
      : "✓ Точные параметры, научная логика, проверка формул и осмысленное понимание предмета!";
  });
}

// --- 4. Student Age Tracks (1-4, 5-8, 9-11) ---
function initStudentTracks() {
  const trackBtns = document.querySelectorAll(".student-tab-btn");
  const trackBadge = document.getElementById("trackBadge");
  const trackTitle = document.getElementById("trackTitle");
  const trackDesc = document.getElementById("trackDesc");
  const feat1Title = document.getElementById("trackFeat1Title");
  const feat1Desc = document.getElementById("trackFeat1Desc");
  const feat2Title = document.getElementById("trackFeat2Title");
  const feat2Desc = document.getElementById("trackFeat2Desc");

  const skill1Bar = document.getElementById("trackSkill1Bar");
  const skill2Bar = document.getElementById("trackSkill2Bar");
  const skill3Bar = document.getElementById("trackSkill3Bar");

  const tracksData = {
    "1-4": {
      badgeRu: "Начальная школа (1–4 классы)",
      badgeKz: "Бастауыш сынып (1–4 сыныптар)",
      titleRu: "AI Юниор: Творчество, первые сказки и визуальная логика",
      titleKz: "AI Юниор: Шығармашылық, алғашқы ертегілер мен визуалды логика",
      descRu: "Игровое знакомство с ИИ: иллюстрирование детских историй, голосовые команды и базовое алгоритмическое мышление.",
      descKz: "ЖИ-мен ойын түрінде танысу: балалар ертегілерін иллюстрациялау, дауыстық командалар және алгоритмдік ойлау.",
      f1TitleRu: "Генерация историй и комиксов",
      f1TitleKz: "Әңгімелер мен комикстер құру",
      f1DescRu: "Создание собственных иллюстрированных книг через подсказки ассистенту.",
      f1DescKz: "Көмекшіге сұраныс беру арқылы суретті кітаптар жасау.",
      f2TitleRu: "Цифровая гигиена и безопасность",
      f2TitleKz: "Цифрлық гигиена және қауіпсіздік",
      f2DescRu: "Понимание границ работы алгоритмов и защита личных данных.",
      f2DescKz: "Алгоритм шектерін түсіну және жеке деректерді қорғау.",
      s1: "92%", s2: "78%", s3: "85%"
    },
    "5-8": {
      badgeRu: "Средняя школа (5–8 классы)",
      badgeKz: "Орта сынып (5–8 сыныптар)",
      titleRu: "AI Explorer: Практика, чат-боты и учеба на максимум",
      titleKz: "AI Explorer: Практика, чат-боттар және тиімді оқу",
      descRu: "Освоение прикладных инструментов: промпт-инжиниринг, визуальные проекты, презентации и создание интерактивных ботов.",
      descKz: "Қолданбалы құралдарды меңгеру: промпт-инжиниринг, визуалды жобалар, презентациялар және чат-боттар.",
      f1TitleRu: "Промпт-инжиниринг для школьников",
      f1TitleKz: "Оқушыларға арналған промптинг",
      f1DescRu: "Многошаговые запросы для решения задач по математике, физике и языкам.",
      f1DescKz: "Математика, физика және тілдер бойынша тапсырмалар шешу промпттары.",
      f2TitleRu: "Разработка ботов и викторин",
      f2TitleKz: "Боттар мен викториналар жасау",
      f2DescRu: "Интерактивные помощники в Telegram и веб-квизы без сложного кодинга.",
      f2DescKz: "Күрделі кодсыз Telegram көмекшілері мен веб-квиздер.",
      s1: "88%", s2: "94%", s3: "82%"
    },
    "9-11": {
      badgeRu: "Старшая школа (9–11 классы)",
      badgeKz: "Жоғары сынып (9–11 сыныптар)",
      titleRu: "AI Профи: Модели, кодинг с ИИ и профориентация",
      titleKz: "AI Профи: Модельдер, ЖИ-мен кодтау және кәсіби бағдар",
      descRu: "Глубокое изучение принципов ML, подключение API, автоматизация задач и подготовка к профессиям будущего.",
      descKz: "ML қағидаларын терең оқу, API қосу, тапсырмаларды автоматтандыру және болашақ мамандықтары.",
      f1TitleRu: "Основы машинного обучения и API",
      f1TitleKz: "Машиналық оқыту және API негіздері",
      f1DescRu: "Работа с открытыми моделями, настройка параметров и скрипты автоматизации.",
      f1DescKz: "Ашық модельдермен жұмыс, параметрлерді баптау және скрипттер.",
      f2TitleRu: "AI-портфолио и стартап-проекты",
      f2TitleKz: "AI-портфолио және стартап жобалар",
      f2DescRu: "Реальные проекты для резюме и поступления в ведущие технологические вузы.",
      f2DescKz: "Резюме мен озық технологиялық ЖОО-ға түсуге арналған нақты жобалар.",
      s1: "96%", s2: "89%", s3: "95%"
    }
  };

  trackBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      trackBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-track");
      const data = tracksData[key];
      if (!data) return;

      const isKz = (typeof currentLang !== "undefined" && currentLang === "kz");
      if (trackBadge) trackBadge.textContent = isKz ? data.badgeKz : data.badgeRu;
      if (trackTitle) trackTitle.textContent = isKz ? data.titleKz : data.titleRu;
      if (trackDesc) trackDesc.textContent = isKz ? data.descKz : data.descRu;
      if (feat1Title) feat1Title.textContent = isKz ? data.f1TitleKz : data.f1TitleRu;
      if (feat1Desc) feat1Desc.textContent = isKz ? data.f1DescKz : data.f1DescRu;
      if (feat2Title) feat2Title.textContent = isKz ? data.f2TitleKz : data.f2TitleRu;
      if (feat2Desc) feat2Desc.textContent = isKz ? data.f2DescKz : data.f2DescRu;

      if (skill1Bar) skill1Bar.style.width = data.s1;
      if (skill2Bar) skill2Bar.style.width = data.s2;
      if (skill3Bar) skill3Bar.style.width = data.s3;
    });
  });
}

// --- 5. Teacher Bento Cockpit (Analytics Simulation) ---
function initTeacherBento() {
  const classBtns = document.querySelectorAll(".class-pill-btn");
  const chartPath = document.getElementById("chartLinePath");
  const chartArea = document.getElementById("chartAreaPath");
  const recText = document.getElementById("bentoRecText");
  const highBar = document.querySelector(".dist-seg-high");
  const midBar = document.querySelector(".dist-seg-mid");
  const lowBar = document.querySelector(".dist-seg-low");

  const classData = {
    "7-A": {
      lineD: "M 30 140 Q 120 120 220 100 T 420 50 T 600 25",
      areaD: "M 30 140 Q 120 120 220 100 T 420 50 T 600 25 L 600 170 L 30 170 Z",
      high: "25%", mid: "50%", low: "25%",
      recRu: "8 учеников испытывают сложности с формулировкой уточняющих запросов. Рекомендуется провести практическое занятие по теме «Как правильно задавать вопросы ИИ».",
      recKz: "8 оқушы нақтылаушы сұраныстарды құрастыруда қиналуда. «ЖИ-ге сұрақты қалай дұрыс қою керек» тақырыбында қосымша сабақ өткізу ұсынылады."
    },
    "9-B": {
      lineD: "M 30 150 Q 140 130 240 85 T 440 40 T 600 18",
      areaD: "M 30 150 Q 140 130 240 85 T 440 40 T 600 18 L 600 170 L 30 170 Z",
      high: "40%", mid: "45%", low: "15%",
      recRu: "Класс отлично освоил промптинг (88%). Рекомендуется перейти к модулю создания первых скриптов и интеграции API нейросетей.",
      recKz: "Сынып промптингті өте жақсы меңгерді (88%). Алғашқы скрипттерді жазу және нейрожелілер API-ін қосу модуліне өту ұсынылады."
    },
    "11-A": {
      lineD: "M 30 130 Q 130 90 250 60 T 450 25 T 600 10",
      areaD: "M 30 130 Q 130 90 250 60 T 450 25 T 600 10 L 600 170 L 30 170 Z",
      high: "60%", mid: "35%", low: "5%",
      recRu: "95% учащихся успешно защитили выпускные AI-проекты. 4 команды готовы к отправке работ на международный конкурс хакатона.",
      recKz: "Оқушылардың 95%-ы бітіру AI-жобаларын сәтті қорғады. 4 команда халықаралық хакатон байқауына дайын."
    }
  };

  classBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      classBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cName = btn.getAttribute("data-class");
      const item = classData[cName];
      if (!item) return;

      if (chartPath) chartPath.setAttribute("d", item.lineD);
      if (chartArea) chartArea.setAttribute("d", item.areaD);

      if (highBar) highBar.style.width = item.high;
      if (midBar) midBar.style.width = item.mid;
      if (lowBar) lowBar.style.width = item.low;

      const isKz = (typeof currentLang !== "undefined" && currentLang === "kz");
      if (recText) recText.textContent = isKz ? item.recKz : item.recRu;
    });
  });
}

// --- 6. FAQ Accordion ---
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question-btn");
    const body = item.querySelector(".faq-answer-body");
    if (!btn || !body) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      // Close all others
      faqItems.forEach(other => {
        other.classList.remove("active");
        const otherBody = other.querySelector(".faq-answer-body");
        if (otherBody) otherBody.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("active");
        body.style.maxHeight = body.scrollHeight + 30 + "px";
      }
    });
  });
}

// --- 7. Stat Counters Animation ---
function initStatCounters() {
  const statSection = document.querySelector(".stats-strip");
  if (!statSection) return;

  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateNumbers();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statSection);

  function animateNumbers() {
    const counters = document.querySelectorAll(".stat-number");
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute("data-target"), 10);
      const suffix = counter.getAttribute("data-suffix") || "";
      let count = 0;
      const step = Math.max(1, Math.floor(target / 40));

      const timer = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        counter.textContent = count.toLocaleString() + suffix;
      }, 30);
    });
  }
}

// --- 8. Lead Capture Modal ---
function initModal() {
  const modal = document.getElementById("leadModal");
  const openBtns = document.querySelectorAll("[data-open-modal]");
  const closeBtn = document.getElementById("modalCloseBtn");
  const form = document.getElementById("leadForm");
  const modalBody = document.getElementById("modalBodyContent");
  const successBox = document.getElementById("modalSuccessState");

  if (!modal) return;

  function openModal() {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (form && modalBody && successBox) {
      setTimeout(() => {
        modalBody.style.display = "block";
        successBox.style.display = "none";
        form.reset();
      }, 300);
    }
  }

  openBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (modalBody && successBox) {
        modalBody.style.display = "none";
        successBox.style.display = "block";
      }
    });
  }
}
