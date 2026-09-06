/* ============================================================
   AI Sana — пятая версия · поведение
   Мотор: Lenis (плавный скролл) + GSAP ScrollTrigger.
   Графики — рукописный inline SVG (подход second-version), без Chart.js.
   ============================================================ */
(function () {
  "use strict";

  /* reduced — живая величина, а не снимок при загрузке: пользователь может
     переключить настройку системы, не перезагружая страницу. */
  var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = rmq.matches;

  function onReducedChange() {
    reduced = rmq.matches;
    if (reduced) freezeMotion();
  }
  if (rmq.addEventListener) rmq.addEventListener("change", onReducedChange);
  else if (rmq.addListener) rmq.addListener(onReducedChange);

  /* Не переинициализация, а заморозка: всё показать и остановить.
     CSS-часть (@media prefers-reduced-motion) переключается сама. */
  function freezeMotion() {
    document.querySelectorAll(".js-rise, .js-fade, .js-rise-plain, .js-split").forEach(function (n) {
      n.classList.add("is-in");
    });
    document.querySelectorAll(".word").forEach(function (w) { w.classList.add("is-lit"); });
    killLit();
    if (window.__scene) { window.__scene.dispose(); window.__scene = null; }
  }

  /* --- гейты возможностей и мощности --- */
  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && c.getContext("webgl2")) ||
             !!(window.WebGLRenderingContext &&
                (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  var coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  var conn = navigator.connection;
  var lowPower = coarse ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (navigator.deviceMemory || 8) <= 4 ||
    !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || "")));

  var NS = "http://www.w3.org/2000/svg";

  /* ==========================================================
     1. WORD-MASK СПЛИТТЕР (моторика Noomo)
     Разбивает заголовок на слова, сохраняя вложенные элементы
     (нужно для pill-хайлайта <span class="hl">).
     ========================================================== */
  function splitWords(host) {
    if (!host || reduced) return [];
    var out = [];
    var frag = document.createDocumentFragment();

    Array.prototype.slice.call(host.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/\s+/).forEach(function (w) {
          if (!w) return;
          var mask = document.createElement("span");
          mask.className = "word-mask";
          var word = document.createElement("span");
          word.className = "word";
          word.textContent = w;
          mask.appendChild(word);
          frag.appendChild(mask);
          out.push(word);
        });
      } else if (node.nodeType === 1) {
        /* элемент (например .hl) — одно «слово» целиком */
        var mask2 = document.createElement("span");
        mask2.className = "word-mask";
        node.classList.add("word");
        mask2.appendChild(node);
        frag.appendChild(mask2);
        out.push(node);
      }
    });

    host.textContent = "";
    host.appendChild(frag);
    host.classList.add("js-reveal");
    return out;
  }

  /* ==========================================================
     2. ПРЕЛОАДЕР — счётчик % + логотип, «O» растягивается в бар
     Привязан к загрузке шрифтов, жёсткий потолок 1200 мс.
     ========================================================== */
  function initPreloader(done) {
    var pre = document.getElementById("pre");
    var pct = document.getElementById("prePct");
    var bar = document.getElementById("preBar");
    if (!pre || reduced) { if (pre) pre.remove(); done(); return; }

    var CAP = 1100;          /* жёсткий потолок: лендинг не ждёт дольше */
    var MIN = 420;           /* минимум, чтобы момент был читаемым */
    var t0 = Date.now();
    var ready = false;
    var finished = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { ready = true; });

    /* Таймер, а не requestAnimationFrame: в фоновой вкладке rAF
       останавливается, и прелоадер завис бы навсегда. */
    var tick = setInterval(function () {
      var e = Date.now() - t0;
      /* до готовности шрифтов ползём максимум до 92%, потом добираем до 100 */
      var p = ready ? Math.min(1, e / MIN) : Math.min(0.92, e / CAP);
      paint(Math.round(p * 100));
      if ((ready && e >= MIN) || e >= CAP) finish();
    }, 40);

    /* страховка на случай, если таймер задушен вкладкой */
    setTimeout(finish, CAP + 600);

    function paint(v) {
      pct.textContent = v;
      bar.style.width = (6 + v * 0.34) + "rem";
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      paint(100);
      setTimeout(function () {
        pre.classList.add("is-done");
        setTimeout(function () { if (pre.parentNode) pre.remove(); }, 700);
        done();
      }, 140);
    }
  }

  /* ==========================================================
     3. ДАННЫЕ
     ========================================================== */
  var COURSES = [];
  for (var i = 1; i <= 14; i++) COURSES.push(i);

  var PROGRESS = [45, 58, 67, 78, 85];

  var DESK = [
    [["Айсулу К.", "c4.t", 92, "high"], ["Данияр Т.", "c4.t", 78, "high"], ["Мадина С.", "c3.t", 64, "mid"],
     ["Ерлан Б.", "c4.t", 51, "mid"], ["Алина Ж.", "c5.t", 47, "mid"], ["Тимур А.", "c4.t", 29, "low"]],
    [["Асель М.", "c5.t", 88, "high"], ["Нурлан Ж.", "c4.t", 71, "high"], ["Камила Р.", "c6.t", 59, "mid"],
     ["Санжар О.", "c4.t", 44, "mid"], ["Диана К.", "c3.t", 33, "low"], ["Арман Е.", "c4.t", 22, "low"]],
    [["Айсулу К.", "c4.t", 95, "high"], ["Данияр Т.", "c4.t", 81, "high"], ["Ерлан Б.", "c4.t", 57, "mid"],
     ["Санжар О.", "c4.t", 42, "mid"], ["Тимур А.", "c4.t", 31, "low"], ["Арман Е.", "c4.t", 19, "low"]]
  ];

  /* ==========================================================
     4. SVG-ГРАФИК (подход second-version/app.js)
     ========================================================== */
  function el(tag, attrs, cls) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (cls) n.setAttribute("class", cls);
    return n;
  }

  function plotLine(host, opts) {
    if (!host) return;
    var values = opts.values, labels = opts.labels;
    var w = Math.max(280, Math.round(host.clientWidth) || 620);
    var sparse = w < 460;
    var h = Math.round((opts.height || 300) * (sparse ? 0.8 : 1));
    var padL = 36, padR = 30, padT = 42, padB = 44;
    var min = 30, max = 100;

    host.textContent = "";
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img" });
    svg.setAttribute("aria-label", opts.aria || "");

    var iw = w - padL - padR, ih = h - padT - padB;
    var x = function (i) { return padL + (iw * i) / (values.length - 1); };
    var y = function (v) { return padT + ih - (ih * (v - min)) / (max - min); };

    [40, 60, 80].forEach(function (tv) {
      svg.appendChild(el("line", { x1: padL, y1: y(tv), x2: w - padR, y2: y(tv) }, "pl-grid"));
      var tick = el("text", { x: 0, y: y(tv) + 4 }, "pl-tx");
      tick.textContent = String(tv);
      svg.appendChild(tick);
    });
    svg.appendChild(el("line", { x1: padL, y1: padT + ih, x2: w - padR, y2: padT + ih }, "pl-axis"));

    var d = "";
    values.forEach(function (v, i) {
      var px = x(i), py = y(v);
      if (i === 0) { d += "M" + px + " " + py; }
      else {
        var pxp = x(i - 1), pyp = y(values[i - 1]), cx = (pxp + px) / 2;
        d += " C" + cx + " " + pyp + " " + cx + " " + py + " " + px + " " + py;
      }
    });
    var path = el("path", { d: d }, "pl-line");
    svg.appendChild(path);

    values.forEach(function (v, i) {
      svg.appendChild(el("circle", { cx: x(i), cy: y(v), r: 4.5 }, "pl-dot"));
      var anchor = i === 0 ? "start" : (i === values.length - 1 ? "end" : "middle");
      var val = el("text", { x: x(i), y: y(v) - 15, "text-anchor": anchor }, "pl-val");
      val.textContent = v + "%";
      svg.appendChild(val);
      if (labels[i] && (!sparse || i === 0 || i === values.length - 1)) {
        var lab = el("text", { x: x(i), y: h - 14, "text-anchor": anchor }, "pl-tx");
        lab.textContent = labels[i];
        svg.appendChild(lab);
      }
    });

    host.appendChild(svg);

    if (!reduced) {
      var len = path.getTotalLength();
      path.style.setProperty("--len", len);
      path.classList.add("is-drawing");
    }
  }

  function renderCharts() {
    plotLine(document.getElementById("anProgress"), {
      values: PROGRESS,
      labels: [t("an.m1"), t("an.m2"), t("an.m3"), t("an.m4"), t("an.m5")],
      aria: t("an.p1.cap")
    });
  }

  /* ==========================================================
     5. РЕНДЕР СПИСКОВ
     ========================================================== */
  function renderCourses() {
    var host = document.getElementById("courseGrid");
    if (!host) return;
    host.textContent = "";
    COURSES.forEach(function (n) {
      var art = document.createElement("article");
      art.className = "course js-rise";
      var num = n < 10 ? "0" + n : String(n);
      art.innerHTML =
        '<div class="course__top"><span class="micro micro--accent">' + num + '</span>' +
        '<span class="tag" data-i18n="c' + n + '.g"></span></div>' +
        '<h3 data-i18n="c' + n + '.t"></h3>' +
        '<p data-i18n="c' + n + '.d"></p>' +
        '<a class="link-roll" href="#cta" style="margin-top:1.6rem">' +
        '<span class="r1" data-i18n="courses.view"></span>' +
        '<span class="r2" data-i18n="courses.view"></span></a>';
      host.appendChild(art);
    });
  }

  function renderDesk(idx) {
    var body = document.getElementById("deskBody");
    if (!body) return;
    body.textContent = "";
    DESK[idx].forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row[0] + "</td>" +
        "<td>" + t(row[1]) + "</td>" +
        '<td><div class="desk__prog"><div class="meter"><i style="width:' + row[2] + '%"></i></div>' +
        '<span class="micro">' + row[2] + "%</span></div></td>" +
        '<td><span class="lvl lvl--' + row[3] + '">' + t("tc.lvl." + row[3]) + "</span></td>";
      body.appendChild(tr);
    });
  }

  /* Выноски на визуале героя (приём mazehq.com), но со смыслом:
     подписи — направления платформы, а не декор. Лейблы несут data-i18n,
     поэтому applyTranslations переводит их сама — как у 14 курсов и 14 FAQ,
     и обработчику languageChanged добавлять ничего не нужно.
     Поле `a` — 3D-якорь на сфере, используется начиная с фазы 5. */
  var PINS = [
    { k: "hero.pin1", side: "right", x: 62, y: 18, a: [ 0.82,  0.48, 0.30] },
    { k: "hero.pin2", side: "left",  x: 88, y: 32, a: [-0.70,  0.10, 0.70] },
    { k: "hero.pin3", side: "right", x: 68, y: 46, a: [ 0.55, -0.55, 0.62] },
    { k: "hero.pin4", side: "left",  x: 84, y: 58, a: [-0.45, -0.72, 0.52] },
    { k: "hero.pin5", side: "right", x: 60, y: 70, a: [ 0.20,  0.88, 0.43] }
  ];

  function renderPins() {
    var host = document.getElementById("heroPins");
    if (!host) return;
    host.textContent = "";
    PINS.forEach(function (p) {
      var d = document.createElement("div");
      /* js-fade, а не js-rise: .js-rise пишет transform, а пин двигает
         себя сам — конфликт. Ревил у пина только по opacity. */
      /* is-on — «лицевая сторона»; при статических координатах всегда true,
         фаза 5 начнёт снимать его для точек на обратной стороне сферы */
      /* без js-fade: правило .js-fade.is-in (0,2,0) перебивало бы
         .pin.is-in.is-on и пин никогда бы не гас. Видимость пина
         описывается только его собственной парой классов. */
      d.className = "pin pin--" + p.side + " is-on";
      /* left/top в процентах, а не transform: у .pin нулевой собственный
         бокс (дети абсолютные), и translate(%) считался бы от нуля.
         Фаза 5 обнулит left/top и перейдёт на transform в пикселях. */
      d.style.left = p.x + "%";
      d.style.top = p.y + "%";
      d.innerHTML = '<span class="pin__label" data-i18n="' + p.k + '"></span>' +
                    '<span class="pin__line"></span>' +
                    '<span class="pin__dot"></span>';
      host.appendChild(d);
    });
  }

  function renderFaq() {
    var host = document.getElementById("faqList");
    if (!host) return;
    host.textContent = "";
    for (var n = 1; n <= 14; n++) {
      var num = n < 10 ? "0" + n : String(n);
      var item = document.createElement("div");
      item.className = "faq__item";
      item.innerHTML =
        '<button class="faq__q" aria-expanded="false" aria-controls="fa' + n + '">' +
        '<span class="micro">' + num + "</span>" +
        '<span data-i18n="faq.q' + n + '"></span>' +
        '<span class="faq__ico"></span></button>' +
        '<div class="faq__a" id="fa' + n + '"><div><p data-i18n="faq.a' + n + '"></p></div></div>';
      host.appendChild(item);
    }
  }

  /* ==========================================================
     6. АНИМАЦИИ
     ========================================================== */

  /* Если GSAP не загрузился (офлайн, блокировка CDN) — контент
     обязан остаться видимым, а не залипнуть на opacity:0. */
  function motionFallback() {
    /* без GSAP секция «Как работает» не пинится — показываем все шаги списком */
    document.querySelectorAll("#howPanes .how__pane").forEach(function (p) {
      p.classList.add("is-on");
    });
    /* без ScrollTrigger подсветка невозможна — нейтральное состояние
       «все слова яркие», иначе текст останется тусклым навсегда */
    litFallback();
  }

  /* GSAP отвечает только за один запиненный скраб и плавный скролл.
     Все ревилы — на CSS-транзишенах (см. initReveals). */
  /* ScrollTrigger нельзя использовать до registerPlugin. Стартовый
     setLanguage() шлёт languageChanged раньше, чем отработает initMotion,
     поэтому нужен явный флаг, а не проверка наличия window.ScrollTrigger. */
  var motionReady = false;

  function initMotion() {
    if (reduced || !window.gsap) { motionFallback(); return; }
    gsap.registerPlugin(ScrollTrigger);
    motionReady = true;

    /* плавный скролл — но без скролл-джекинга: длина страницы нативная */
    if (window.Lenis) {
      var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    initHowScrub();
    initLit();
    initSceneScroll();
  }

  /* --- единственный скраб: секция «Как работает», только ≥1024px --- */
  var howST = null;
  function setHowStep(i) {
    document.querySelectorAll("#howPanes .how__pane").forEach(function (p, n) {
      p.classList.toggle("is-on", n === i);
    });
    document.querySelectorAll("#howNav button").forEach(function (b, n) {
      b.classList.toggle("is-on", n === i);
    });
  }

  function initHowScrub() {
    var wrap = document.getElementById("howWrap");
    if (!wrap || !window.ScrollTrigger) return;

    gsap.matchMedia().add("(min-width: 1024px)", function () {
      howST = ScrollTrigger.create({
        trigger: "#how",
        start: "top top",
        end: "+=400%",
        pin: wrap,
        scrub: 1,
        onUpdate: function (self) {
          setHowStep(Math.min(4, Math.floor(self.progress * 5)));
        }
      });
      return function () { if (howST) { howST.kill(); howST = null; } setHowStep(0); };
    });

    document.querySelectorAll("#howNav button").forEach(function (b) {
      b.addEventListener("click", function () { setHowStep(Number(b.dataset.step)); });
    });
  }

  /* --- пословная подсветка по скроллу: второй канал того же DOM ---
     splitWords уже нарезал .word; ревил двигает transform, подсветка красит
     color — свойства разные, поэтому каналы не конфликтуют. */
  var litSTs = [];

  function litFallback() {
    document.querySelectorAll(".js-lit .word").forEach(function (w) {
      w.classList.add("is-lit");
    });
  }

  function killLit() {
    litSTs.forEach(function (st) { st.kill(); });
    litSTs = [];
    document.querySelectorAll(".js-lit .word.is-lit").forEach(function (w) {
      w.classList.remove("is-lit");
    });
  }

  function initLit() {
    killLit();
    if (reduced || !motionReady) { litFallback(); return; }

    document.querySelectorAll(".js-lit").forEach(function (host) {
      /* .hl — pill-хайлайт, splitWords завернул его целиком как одно «слово».
         Красить его нельзя: серый текст на синей таблетке читается как баг. */
      var words = host.querySelectorAll(".word:not(.hl)");
      if (!words.length) return;

      var paint = function (self) {
        var n = Math.round(self.progress * words.length);
        for (var i = 0; i < words.length; i++) {
          words[i].classList.toggle("is-lit", i < n);
        }
      };

      litSTs.push(ScrollTrigger.create({
        /* хост выше линии сгиба стартует с progress=1 — для него
           триггер переопределяется через data-атрибуты */
        trigger: host.dataset.litTrigger || host,
        start: host.dataset.litStart || "top 88%",
        end: host.dataset.litEnd || "bottom 55%",
        onUpdate: paint,
        /* onRefresh обязателен: после пересчёта раскладки прогресс может
           не измениться, onUpdate не вызовется, и классы останутся от
           первого (ещё неверного) замера */
        onRefresh: paint
      }));
    });
  }

  /* ==========================================================
     6b. РЕВИЛЫ — IntersectionObserver + CSS-транзишены
     Не зависят от GSAP и от rAF-тикера: срабатывают даже если
     CDN не доехал или вкладка была в фоне.
     ========================================================== */
  var revealIO = null;

  /* Разбивает заголовки на слова и раздаёт stagger через --d.
     Вызывается заново после смены языка: applyTranslations перезаписывает
     innerHTML заголовка и уничтожает маски. */
  function splitAll() {
    document.querySelectorAll(".js-split").forEach(function (host) {
      host.classList.remove("is-in");
      var words = splitWords(host);
      words.forEach(function (w, i) { w.style.setProperty("--d", (i * 0.04) + "s"); });
      if (revealIO) revealIO.observe(host);
    });
  }

  function initReveals() {
    if (reduced) return;

    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });

    splitAll();
    /* js-rise-plain — узлы, которым нужен только класс .is-in, без
       собственного opacity/transform из .js-rise (рельса цепочки, рёбра эко) */
    document.querySelectorAll(".js-rise, .js-fade, .js-rise-plain, .pin")
      .forEach(function (n) { revealIO.observe(n); });
  }

  /* ==========================================================
     7. СЧЁТЧИКИ (rAF-паттерн из second-version)
     ========================================================== */
  function initCounters() {
    var host = document.getElementById("stats");
    if (!host) return;
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || fired) return;
        fired = true;
        host.querySelectorAll(".num").forEach(function (node) {
          var to = Number(node.dataset.to);
          var suffix = node.dataset.suffix || "";
          if (reduced) { node.textContent = fmt(to) + suffix; return; }
          var t0 = performance.now(), dur = 1400;
          (function step(now) {
            var p = Math.min((now - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = fmt(Math.round(to * eased)) + suffix;
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        });
        io.disconnect();
      });
    }, { threshold: .3 });
    io.observe(host);

    function fmt(n) { return n.toLocaleString("ru-RU").replace(/ /g, " "); }
  }

  /* ==========================================================
     8. FAQ · ДАШБОРД · УРОК · МОДАЛКА · ШАПКА
     ========================================================== */
  function initFaq() {
    var host = document.getElementById("faqList");
    if (!host) return;
    host.addEventListener("click", function (e) {
      var q = e.target.closest(".faq__q");
      if (!q) return;
      var open = q.getAttribute("aria-expanded") === "true";
      host.querySelectorAll(".faq__q").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      host.querySelectorAll(".faq__a").forEach(function (a) { a.classList.remove("is-open"); });
      if (!open) {
        q.setAttribute("aria-expanded", "true");
        q.nextElementSibling.classList.add("is-open");
      }
    });
  }

  function initDesk() {
    var f = document.getElementById("deskFilters");
    if (!f) return;
    f.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      f.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-on"); });
      chip.classList.add("is-on");
      renderDesk(Number(chip.dataset.desk));
    });
  }

  /* ---- ПРИМЕР УРОКА: пять этапов (п.6.03 ТЗ) + сборщик промпта (п.8) ---- */

  /* четыре условия точного запроса — они засчитываются */
  var LZ_CRIT = ["topic", "volume", "audience", "format"];
  /* «вежливые» добавки — на результат не влияют, это часть урока, а не ловушка */
  var LZ_NOISE = ["polite", "fast"];
  var lzPicked = {};

  function lzCompose() {
    var out = t("lesson.tpl") || "";
    LZ_CRIT.concat(LZ_NOISE).forEach(function (k) {
      var frag = "";
      if (lzPicked[k]) frag = t("lesson.f." + k) || "";
      else if (k === "topic") frag = t("lesson.f.topic0") || "";
      out = out.replace("{" + k + "}", frag);
    });
    var el = document.getElementById("lzText");
    if (el) el.textContent = out;
  }

  function lzRenderChips() {
    var host = document.getElementById("lzChips");
    if (!host) return;
    host.innerHTML = "";
    LZ_CRIT.concat(LZ_NOISE).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lz-chip" + (LZ_NOISE.indexOf(k) > -1 ? " lz-chip--noise" : "");
      b.dataset.k = k;
      b.textContent = t("lesson.c." + k) || k;
      b.setAttribute("aria-pressed", lzPicked[k] ? "true" : "false");
      if (lzPicked[k]) b.classList.add("is-on");
      host.appendChild(b);
    });
  }

  function lzResetVerdict() {
    var v = document.getElementById("lzVerdict");
    var s = document.getElementById("lzScore");
    var idle = document.getElementById("lzIdle");
    if (v) v.innerHTML = "";
    if (s) { s.hidden = true; s.textContent = ""; }
    if (idle) idle.hidden = false;
  }

  function lzCheck() {
    var v = document.getElementById("lzVerdict");
    var s = document.getElementById("lzScore");
    var idle = document.getElementById("lzIdle");
    if (!v) return;

    var hit = 0;
    v.innerHTML = "";

    LZ_CRIT.forEach(function (k) {
      var got = !!lzPicked[k];
      if (got) hit++;
      var li = document.createElement("li");
      li.className = got ? "is-ok" : "is-no";
      li.textContent = t((got ? "lesson.ok." : "lesson.no.") + k) || k;
      v.appendChild(li);
    });

    LZ_NOISE.forEach(function (k) {
      if (!lzPicked[k]) return;
      var li = document.createElement("li");
      li.className = "is-note";
      li.textContent = t("lesson.note." + k) || k;
      v.appendChild(li);
    });

    if (idle) idle.hidden = true;
    if (s) {
      s.hidden = false;
      s.textContent = (t("lesson.score") || "{n}/4").replace("{n}", String(hit)) +
        " · " + t(hit === LZ_CRIT.length ? "lesson.all" : "lesson.part");
    }
    /* при полном зачёте открывается дополнительное задание (этап 05) */
    if (hit === LZ_CRIT.length) {
      var li = document.createElement("li");
      li.className = "is-ok";
      li.textContent = t("lesson.next") || "";
      v.appendChild(li);
      var tab5 = document.getElementById("lsTab5");
      if (tab5) tab5.classList.add("is-done");
    }
    /* всегда ведём на разбор — ученик должен увидеть собственный результат */
    lzStep(4);
  }

  function lzStep(n) {
    var tabs = document.getElementById("lsTabs");
    if (!tabs) return;
    tabs.querySelectorAll(".lesson__step").forEach(function (b) {
      var on = Number(b.dataset.step) === n;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      var pane = document.getElementById("lsPane" + b.dataset.step);
      if (pane) pane.hidden = !on;
      /* на мобильном лента этапов горизонтальная — подтягиваем активный в видимую часть */
      if (on && tabs.scrollWidth > tabs.clientWidth) {
        var l = b.offsetLeft, r = l + b.offsetWidth;
        if (l < tabs.scrollLeft) tabs.scrollLeft = l - 16;
        else if (r > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = r - tabs.clientWidth + 16;
      }
    });
  }

  function initLesson() {
    var tabs = document.getElementById("lsTabs");
    var chips = document.getElementById("lzChips");
    if (!tabs || !chips) return;

    tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".lesson__step");
      if (b) lzStep(Number(b.dataset.step));
    });

    /* стрелки внутри tablist — стандартное поведение вкладок */
    tabs.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
            : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var cur = Number((tabs.querySelector(".lesson__step.is-on") || {}).dataset.step || 1);
      var next = ((cur - 1 + d + 5) % 5) + 1;
      lzStep(next);
      var el = document.getElementById("lsTab" + next);
      if (el) el.focus();
    });

    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".lz-chip");
      if (!b) return;
      var k = b.dataset.k;
      lzPicked[k] = !lzPicked[k];
      b.classList.toggle("is-on", lzPicked[k]);
      b.setAttribute("aria-pressed", lzPicked[k] ? "true" : "false");
      lzCompose();
      lzResetVerdict();
    });

    var check = document.getElementById("lzCheck");
    if (check) check.addEventListener("click", lzCheck);

    var reset = document.getElementById("lzReset");
    if (reset) reset.addEventListener("click", function () {
      lzPicked = {};
      lzRenderChips();
      lzCompose();
      lzResetVerdict();
    });

    lzRenderChips();
    lzCompose();
  }

  function initModal() {
    var modal = document.getElementById("modal");
    if (!modal) return;
    var form = document.getElementById("modalForm");
    var done = document.getElementById("modalDone");
    var last = null;

    function open(e) {
      if (e) e.preventDefault();
      last = document.activeElement;
      modal.classList.add("is-open");
      form.hidden = false; done.hidden = true;
      var focusable = modal.querySelector("input, button");
      if (focusable) focusable.focus();
    }
    function close() {
      modal.classList.remove("is-open");
      if (last) last.focus();
    }

    document.querySelectorAll("[data-modal]").forEach(function (b) { b.addEventListener("click", open); });
    modal.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", close); });

    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      /* фокус-трап */
      var list = Array.prototype.filter.call(
        modal.querySelectorAll("a[href], button, input, [tabindex]:not([tabindex='-1'])"),
        function (n) { return n.offsetParent !== null; }
      );
      if (!list.length) return;
      var first = list[0], lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });

    document.getElementById("demoForm").addEventListener("submit", function (e) {
      e.preventDefault();
      form.hidden = true; done.hidden = false;
      done.querySelector(".btn").focus();
    });
  }

  function initHead() {
    var head = document.getElementById("head");
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");

    window.addEventListener("scroll", function () {
      head.classList.toggle("is-stuck", window.scrollY > 40);
    }, { passive: true });

    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      nav.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          nav.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
    }

    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.addEventListener("click", function () { window.setLanguage(b.dataset.lang); });
    });
  }

  /* ==========================================================
     9. СТАРТ
     ========================================================== */

  /* Сцена грузится лениво, после первой отрисовки и только за гейтами:
     LCP не страдает, а на слабых устройствах и при saveData её просто нет. */
  function bootScene() {
    if (reduced || !hasWebGL()) return;
    if (conn && conn.saveData) return;

    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 600); };
    idle(function () {
      import("./scene.js").then(function (m) {
        window.__scene = m.initScene({
          canvas: document.getElementById("scene"),
          particles: lowPower ? 12000 : 24000,
          dpr: Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2),
          onFrame: updatePins
        });
        initSceneScroll();
        initScenePointer();
        initPinAnchors();
      }).catch(function () {
        /* тихо: ink-полосы прозрачны, под ними body цвета --ink-900 —
           страница выглядит ровно как без сцены */
      });
    });
  }

  /* --- пины на 3D-якорях (замыкание приёма mazehq.com) ---
     До этого координаты были статическими процентами; теперь каждый кадр
     берётся проекция точки на сфере. Пишем только в transform. */
  var pinEls = [];
  var pinsHost = null;
  var pinsHostRect = null;
  var heroInView = false;
  var _out = { x: 0, y: 0, visible: true };

  function initPinAnchors() {
    pinsHost = document.getElementById("heroPins");
    if (!pinsHost || coarse) return;

    pinEls = [].slice.call(pinsHost.querySelectorAll(".pin"));
    pinEls.forEach(function (el, i) {
      /* статическое размещение уступает место проекции */
      el.style.left = "0";
      el.style.top = "0";
      el.__a = PINS[i].a;
      el.__left = PINS[i].side === "left";
    });

    /* обновляем только пока герой во вьюпорте — иначе 5 записей в стиль
       на каждый кадр всей страницы */
    var io = new IntersectionObserver(function (e) {
      heroInView = e[0].isIntersecting;
      if (heroInView) pinsHostRect = pinsHost.getBoundingClientRect();
    }, { threshold: 0 });
    io.observe(document.getElementById("hero"));

    window.addEventListener("scroll", function () {
      if (heroInView) pinsHostRect = pinsHost.getBoundingClientRect();
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
      /* Показываем только на лицевой стороне И в зоне, где выноска
         целиком помещается: не заезжает в текстовую колонку слева
         и не обрезается правым краем окна. */
      /* ширину лейбла кэшируем, но только когда раскладка её уже знает:
         иначе в кэш попадает 0 и зона допуска перестаёт работать */
      var lw = el.__lw;
      if (!lw) {
        var w = el.firstChild.offsetWidth;
        lw = w ? (el.__lw = w + 60) : 240;
      }
      var minX = window.innerWidth * 0.46 + (el.__left ? lw : 0);
      var maxX = window.innerWidth - (el.__left ? 20 : lw);
      var inBounds = _out.x > minX && _out.x < maxX &&
                     _out.y > 90 && _out.y < pinsHostRect.height - 40;
      el.classList.toggle("is-on", _out.visible && inBounds);
    }
  }

  /* --- камера по секциям: цели + лерп внутри сцены, а не скраб --- */
  var SCENE_STATES = [
    /* dim — приглушение: секции с плотным текстом получают сцену как фон,
       а не как героя. Читаемость важнее эффекта. */
    { sel: "#hero",     camZ: 7.6, rotY: 0.0, spread: 1.00, lift:  0.0, panX: 2.4, dim: 1.00 },
    { sel: "#how",      camZ: 6.2, rotY: 0.6, spread: 1.35, lift:  0.3, panX: 3.4, dim: 0.35 },
    { sel: "#pisa",     camZ: 6.4, rotY: 1.2, spread: 0.85, lift: -0.2, panX: 3.2, dim: 0.45 },
    { sel: "#teachers", camZ: 8.2, rotY: 1.9, spread: 1.10, lift:  0.1, panX: 3.0, dim: 0.40 },
    { sel: "#numbers",  camZ: 5.0, rotY: 2.6, spread: 1.60, lift:  0.0, panX: 2.2, dim: 0.85 },
    { sel: "#cta",      camZ: 9.0, rotY: 3.1, spread: 0.70, lift: -0.4, panX: 2.6, dim: 0.90 }
  ];

  var sceneScrollDone = false;
  function initSceneScroll() {
    /* Вызывается из двух мест: после резолва import() и из initMotion.
       Что отработает вторым — неизвестно, поэтому флаг против дублей. */
    if (sceneScrollDone || !motionReady || !window.__scene) return;
    sceneScrollDone = true;

    /* тот же matchMedia-паттерн с cleanup, что у initHowScrub */
    gsap.matchMedia().add("(min-width: 1024px)", function () {
      var sts = SCENE_STATES.map(function (st) {
        var el = document.querySelector(st.sel);
        if (!el) return null;
        var apply = function () { if (window.__scene) window.__scene.setTarget(st); };
        return ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onEnter: apply,
          onEnterBack: apply
        });
      }).filter(Boolean);

      return function () {
        sts.forEach(function (x) { x.kill(); });
        if (window.__scene) window.__scene.setTarget(SCENE_STATES[0]);
      };
    });
  }

  /* --- единственный pointermove в проекте: параллакс сцены --- */
  function initScenePointer() {
    if (coarse || !window.__scene) return;
    var queued = false, px = 0, py = 0;
    window.addEventListener("pointermove", function (e) {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = -((e.clientY / window.innerHeight) * 2 - 1);
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (window.__scene) window.__scene.setMouse(px, py);
      });
    }, { passive: true });
  }

  function whenGsap(cb) {
    if (window.gsap && window.ScrollTrigger) { cb(); return; }
    var tries = 0;
    var iv = setInterval(function () {
      if (window.gsap && window.ScrollTrigger) { clearInterval(iv); cb(); }
      else if (++tries > 60) { clearInterval(iv); cb(); }  /* 3 с — сдаёмся */
    }, 50);
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* сначала рендерим списки — они содержат data-i18n узлы */
    renderCourses();
    renderFaq();
    /* до setLanguage — тогда applyTranslations заполнит лейблы пинов;
       и до initReveals — тот собирает узлы один раз */
    renderPins();

    window.setLanguage(window.getCurrentLang());
    renderDesk(0);
    renderCharts();

    initHead();
    initFaq();
    initDesk();
    initLesson();
    initModal();
    initCounters();
    initReveals();

    /* Прелоадер уходит по готовности шрифтов и не ждёт CDN.
       Анимации подключаются, когда GSAP доедет; если не доедет
       за 3 с — включается фолбэк и контент просто виден. */
    initPreloader(function () {
      bootScene();
      whenGsap(function () {
        initMotion();
        /* refresh только после того, как раскладка устоялась */
        if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 120);
      });
    });
  });

  /* перерисовка при смене языка */
  window.addEventListener("languageChanged", function () {
    var active = document.querySelector("#deskFilters .chip.is-on");
    renderDesk(active ? Number(active.dataset.desk) : 0);
    renderCharts();
    /* тренажёр урока: чипы и промпт собраны из JS, перевод их не трогает */
    lzRenderChips();
    lzCompose();
    lzResetVerdict();
    /* заголовки пересобираем: перевод перезаписал их innerHTML */
    if (!reduced) splitAll();
    /* splitAll создал новые .word — старые триггеры держат мёртвые узлы */
    initLit();
  });

  var rt;
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      renderCharts();
      /* refresh только при смене ШИРИНЫ: на iOS показ/скрытие URL-бара шлёт
         resize по высоте, и безусловный refresh даёт прыжок скролла. */
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
      if (window.__scene) window.__scene.resize();
    }, 200);
  });
})();
