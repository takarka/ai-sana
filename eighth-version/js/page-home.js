/* ============================================================
   CRAFT AI — Скрипт главной страницы (page-home.js)
   3 пина героя, интерактивный дашборд учителя со статусами,
   аккордеон FAQ
   ============================================================ */

(function () {
  "use strict";

  /* 3 пина модулей на сфере */
  var PINS = [
    { a: [ 0.82,  0.40,  0.50], side: "right", key: "home.pin.m1" },
    { a: [-0.55,  0.65,  0.60], side: "left",  key: "home.pin.m2" },
    { a: [ 0.70, -0.55,  0.55], side: "right", key: "home.pin.m3" }
  ];

  var STUDENTS = [
    { nameRu: "Айсулу Қасымова", nameKz: "Айсұлу Қасымова", grade: "7 «А»", topicRu: "Архитектура LLM · Симулятор", topicKz: "LLM архитектурасы · Симулятор", prog: 96, status: "green", noteRu: "Опережает темп на 2 шага", noteKz: "Қарқыннан 2 қадамға озық" },
    { nameRu: "Данияр Төлеген", nameKz: "Данияр Төлеген", grade: "7 «А»", topicRu: "Промпт-инжиниринг · Шаг 4", topicKz: "Промпт-инжиниринг · 4-қадам", prog: 88, status: "green", noteRu: "Самостоятельное решение", noteKz: "Өз бетінше шешу" },
    { nameRu: "Мадина Сапар", nameKz: "Мадина Сапар", grade: "7 «А»", topicRu: "Вайб-кодинг веб-страницы", topicKz: "Веб-парақша вайб-кодингі", prog: 74, status: "green", noteRu: "В пределах нормы", noteKz: "Қалыпты қарқында" },
    { nameRu: "Ерлан Бақыт", nameKz: "Ерлан Бақыт", grade: "7 «А»", topicRu: "Распознавание фейков PISA", topicKz: "PISA фейктерін анықтау", prog: 58, status: "yellow", noteRu: "Задержка на шаге 3 (валидация)", noteKz: "3-қадамда кідіріс (валидация)" },
    { nameRu: "Алина Жұмабек", nameKz: "Алина Жұмабек", grade: "7 «А»", topicRu: "Декомпозиция задач ИИ", topicKz: "ЖИ тапсырмаларын декомпозициялау", prog: 49, status: "yellow", noteRu: "Требуется уточнение критерия", noteKz: "Критерийді нақтылау қажет" },
    { nameRu: "Тимур Ахметов", nameKz: "Тимур Ахметов", grade: "7 «А»", topicRu: "Синтаксис системного промпта", topicKz: "Жүйелік промпт синтаксисі", prog: 32, status: "red", noteRu: "3 ошибки подряд в симуляторе", noteKz: "Симуляторда қатарынан 3 қате" },
    { nameRu: "Асель Мұрат", nameKz: "Әсел Мұрат", grade: "7 «А»", topicRu: "Автономные ИИ-агенты", topicKz: "Автономды ЖИ-агенттер", prog: 92, status: "green", noteRu: "Высокая точность ответов", noteKz: "Жауаптардың жоғары дәлдігі" },
    { nameRu: "Санжар Омар", nameKz: "Санжар Омар", grade: "7 «А»", topicRu: "Анализ галлюцинаций модели", topicKz: "Модель галлюцинациясын талдау", prog: 24, status: "red", noteRu: "Застрял на фактчекинге датасета", noteKz: "Деректерді тексеруде қиналды" }
  ];

  /* ==========================================================
     1. ПИНЫ ГЕРОЯ
     ========================================================== */
  var pinEls = [];
  var pinsHost = null;
  var pinsHostRect = null;
  var heroInView = false;
  var _out = { x: 0, y: 0, visible: true };

  function renderHeroPins() {
    pinsHost = document.getElementById("heroPins");
    if (!pinsHost) return;
    pinsHost.textContent = "";

    PINS.forEach(function (p) {
      var pin = document.createElement("div");
      pin.className = "pin pin--" + p.side + " js-rise";
      pin.__a = p.a;
      pin.__left = p.side === "left";

      var lbl = document.createElement("div");
      lbl.className = "pin__label";
      lbl.setAttribute("data-i18n", p.key);
      lbl.textContent = window.t ? window.t(p.key) : p.key;

      var line = document.createElement("div");
      line.className = "pin__line";
      var dot = document.createElement("div");
      dot.className = "pin__dot";

      pin.appendChild(lbl);
      pin.appendChild(line);
      pin.appendChild(dot);
      pinsHost.appendChild(pin);
    });

    pinEls = [].slice.call(pinsHost.querySelectorAll(".pin"));

    var heroSec = document.getElementById("hero");
    if (heroSec) {
      var io = new IntersectionObserver(function (e) {
        heroInView = e[0].isIntersecting;
        if (heroInView) pinsHostRect = pinsHost.getBoundingClientRect();
      }, { threshold: 0 });
      io.observe(heroSec);
    }

    window.addEventListener("scroll", function () {
      if (heroInView && pinsHost) pinsHostRect = pinsHost.getBoundingClientRect();
    }, { passive: true });
  }

  function updatePins() {
    if (!heroInView || !pinsHostRect || !window.__scene) return;
    for (var i = 0; i < pinEls.length; i++) {
      var el = pinEls[i];
      window.__scene.projectAnchor(el.__a, _out);
      el.style.transform = "translate(" +
        (_out.x - pinsHostRect.left).toFixed(1) + "px," +
        (_out.y - pinsHostRect.top).toFixed(1) + "px)";

      var lw = el.__lw;
      if (!lw) {
        var w = el.firstChild ? el.firstChild.offsetWidth : 0;
        lw = w ? (el.__lw = w + 50) : 220;
      }
      var minX = window.innerWidth * 0.44 + (el.__left ? lw : 0);
      var maxX = window.innerWidth - (el.__left ? 20 : lw);
      var inBounds = _out.x > minX && _out.x < maxX &&
                     _out.y > 80 && _out.y < pinsHostRect.height - 30;
      el.classList.toggle("is-on", _out.visible && inBounds);
      el.classList.add("is-in");
    }
  }

  /* ==========================================================
     2. ДАШБОРД УЧИТЕЛЯ
     ========================================================== */
  var currentFilter = "all";
  var searchQuery = "";

  function renderTable() {
    var tbody = document.getElementById("deskBody");
    if (!tbody) return;
    tbody.textContent = "";

    var lang = window.getCurrentLang ? window.getCurrentLang() : "ru";

    var filtered = STUDENTS.filter(function (s) {
      if (currentFilter !== "all" && s.status !== currentFilter) return false;
      if (searchQuery) {
        var name = (lang === "kz" ? s.nameKz : s.nameRu).toLowerCase();
        if (name.indexOf(searchQuery.toLowerCase()) === -1) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      var trEmpty = document.createElement("tr");
      var tdEmpty = document.createElement("td");
      tdEmpty.colSpan = 5;
      tdEmpty.style.textAlign = "center";
      tdEmpty.style.padding = "3rem";
      tdEmpty.style.color = "var(--on-ink-dim)";
      tdEmpty.textContent = lang === "kz" ? "Оқушылар табылмады" : "Ученики не найдены";
      trEmpty.appendChild(tdEmpty);
      tbody.appendChild(trEmpty);
      return;
    }

    filtered.forEach(function (s) {
      var tr = document.createElement("tr");

      /* Ученик */
      var tdName = document.createElement("td");
      tdName.className = "desk__student";
      var strong = document.createElement("strong");
      strong.textContent = lang === "kz" ? s.nameKz : s.nameRu;
      var span = document.createElement("span");
      span.textContent = s.grade;
      tdName.appendChild(strong);
      tdName.appendChild(span);

      /* Тема */
      var tdTopic = document.createElement("td");
      tdTopic.textContent = lang === "kz" ? s.topicKz : s.topicRu;

      /* Прогресс */
      var tdProg = document.createElement("td");
      var progWrap = document.createElement("div");
      progWrap.className = "desk__meter";
      var meter = document.createElement("div");
      meter.className = "meter";
      var bar = document.createElement("i");
      bar.style.width = s.prog + "%";
      if (s.status === "green") bar.style.background = "#2ED573";
      else if (s.status === "yellow") bar.style.background = "#FFA502";
      else bar.style.background = "#FF4757";
      meter.appendChild(bar);
      var pct = document.createElement("span");
      pct.style.fontFamily = "JetBrains Mono, monospace";
      pct.style.fontSize = "1.2rem";
      pct.textContent = s.prog + "%";
      progWrap.appendChild(meter);
      progWrap.appendChild(pct);
      tdProg.appendChild(progWrap);

      /* Статус */
      var tdStatus = document.createElement("td");
      var badge = document.createElement("span");
      badge.className = "desk-badge desk-badge--" + s.status;
      if (s.status === "green") {
        badge.textContent = lang === "kz" ? "Қарқында" : "В темпе";
      } else if (s.status === "yellow") {
        badge.textContent = lang === "kz" ? "Бәсеңдеу" : "Замедление";
      } else {
        badge.textContent = lang === "kz" ? "Көмек қажет" : "Нужна помощь";
      }
      tdStatus.appendChild(badge);

      /* Действие / Заметка */
      var tdAction = document.createElement("td");
      tdAction.style.fontSize = "1.4rem";
      tdAction.style.color = s.status === "red" ? "#FF4757" : "var(--on-ink-dim)";
      tdAction.textContent = lang === "kz" ? s.noteKz : s.noteRu;

      tr.appendChild(tdName);
      tr.appendChild(tdTopic);
      tr.appendChild(tdProg);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
    });
  }

  function initTeacherDashboard() {
    var filterBtns = document.querySelectorAll(".desk__filters .chip");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-on"); });
        btn.classList.add("is-on");
        currentFilter = btn.dataset.status || "all";
        renderTable();
      });
    });

    var searchInput = document.getElementById("deskSearch");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        searchQuery = e.target.value.trim();
        renderTable();
      });
    }

    renderTable();
  }

  /* ==========================================================
     3. FAQ АККОРДЕОН
     ========================================================== */
  function initFaq() {
    var items = document.querySelectorAll(".faq__item");
    items.forEach(function (item) {
      var q = item.querySelector(".faq__q");
      var a = item.querySelector(".faq__a");
      if (!q || !a) return;

      q.addEventListener("click", function () {
        var expanded = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!expanded));
        a.classList.toggle("is-open", !expanded);
      });
    });
  }

  /* ==========================================================
     СТАРТ СТРАНИЦЫ
     ========================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    renderHeroPins();
    initTeacherDashboard();
    initFaq();

    if (window.CRAFT && window.CRAFT.bootScene) {
      window.CRAFT.bootScene({
        onFrame: updatePins
      });
    }
  });

  window.addEventListener("languageChanged", function () {
    /* Пины не перерисовываем: их подписи несут data-i18n, и
       applyTranslations() обновляет их сам. Повторный renderHeroPins()
       вешал новый IntersectionObserver и новый scroll-слушатель на
       каждое переключение языка, не снимая предыдущие. */
    renderTable();
  });
})();
