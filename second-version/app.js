/* ============================================================
   AI Mektep — вторая версия. Интерактив и графики.
   Графики рисуются инлайновым SVG, чтобы жить на той же сетке,
   что и страница, и работать без сети.
   ============================================================ */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, cls) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (cls) node.setAttribute("class", cls);
    return node;
  }

  function svgRoot(w, h) {
    var s = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img" });
    return s;
  }

  /* --------------------------------------------------------
     Линейный график: значения по подписям, с осью и точками
     -------------------------------------------------------- */
  function plotLine(host, opts) {
    if (!host) return;
    var values = opts.values, labels = opts.labels;
    var w = Math.max(280, Math.round(host.clientWidth) || 620);
    var sparse = w < 470;      /* совсем узко — оставляем только края шкалы */
    var tight = w < 700;       /* тесно — подписи набираем мельче, чтобы не сталкивались */
    var h = Math.round((opts.height || 350) * (sparse ? 0.74 : 1));
    var padL = 34, padR = 34, padT = 44, padB = 46;
    var min = opts.min !== undefined ? opts.min : 30;
    var max = opts.max !== undefined ? opts.max : 100;

    host.textContent = "";
    var svg = svgRoot(w, h);
    svg.setAttribute("aria-label", opts.aria || "");

    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    var x = function (i) { return padL + (innerW * i) / (values.length - 1); };
    var y = function (v) { return padT + innerH - (innerH * (v - min)) / (max - min); };

    /* горизонтальные линии шкалы */
    (opts.ticks || [40, 60, 80]).forEach(function (tv) {
      svg.appendChild(el("line", { x1: padL, y1: y(tv), x2: w - padR, y2: y(tv) }, "pl-grid"));
      var tick = el("text", { x: 0, y: y(tv) + 4 }, "pl-tx");
      tick.textContent = String(tv);
      svg.appendChild(tick);
    });

    /* ось X */
    svg.appendChild(el("line", { x1: padL, y1: padT + innerH, x2: w - padR, y2: padT + innerH }, "pl-axis"));

    /* линия */
    var d = "";
    values.forEach(function (v, i) {
      var px = x(i), py = y(v);
      if (i === 0) { d += "M" + px + " " + py; }
      else {
        var pxPrev = x(i - 1), pyPrev = y(values[i - 1]);
        var cx = (pxPrev + px) / 2;
        d += " C" + cx + " " + pyPrev + " " + cx + " " + py + " " + px + " " + py;
      }
    });
    var path = el("path", { d: d }, "pl-line");
    svg.appendChild(path);

    /* точки и значения */
    values.forEach(function (v, i) {
      var dot = el("circle", { cx: x(i), cy: y(v), r: 5 }, "pl-dot");
      svg.appendChild(dot);
      var val = el("text", { x: x(i), y: y(v) - 16, "text-anchor": i === 0 ? "start" : (i === values.length - 1 ? "end" : "middle") }, "pl-val");
      val.textContent = v + (opts.unit || "");
      svg.appendChild(val);
      if (labels && labels[i] && (!sparse || i === 0 || i === values.length - 1)) {
        var lab = el("text", { x: x(i), y: h - 16, "text-anchor": i === 0 ? "start" : (i === values.length - 1 ? "end" : "middle") }, "pl-tx");
        if (tight) lab.style.fontSize = "11px";
        lab.textContent = labels[i];
        svg.appendChild(lab);
      }
    });

    host.appendChild(svg);

    if (opts.animate && !reduced) {
      var len = path.getTotalLength();
      path.style.setProperty("--len", len);
      path.classList.add("is-drawing");
      svg.querySelectorAll(".pl-dot, .pl-val").forEach(function (n, i) {
        n.style.opacity = "0";
        n.style.transition = "opacity .3s ease";
        setTimeout(function () { n.style.opacity = "1"; }, 260 + i * 130);
      });
    }
  }

  /* --------------------------------------------------------
     Столбчатый график
     -------------------------------------------------------- */
  function plotBars(host, opts) {
    if (!host) return;
    var values = opts.values, labels = opts.labels;
    var w = Math.max(260, Math.round(host.clientWidth) || 560);
    var h = Math.round((opts.height || 320) * (w < 520 ? 0.78 : 1));
    var padL = 8, padR = 8, padT = 34, padB = 40;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var max = Math.max.apply(null, values) * 1.12;
    var slot = innerW / values.length;
    var bw = Math.min(slot * 0.56, 58);

    host.textContent = "";
    var svg = svgRoot(w, h);
    svg.setAttribute("aria-label", opts.aria || "");

    values.forEach(function (v, i) {
      var bh = (innerH * v) / max;
      var bx = padL + slot * i + (slot - bw) / 2;
      var by = padT + innerH - bh;
      svg.appendChild(el("rect", { x: bx, y: by, width: bw, height: bh, rx: 2 }, i === opts.highlight ? "pl-bar-hi" : "pl-bar"));
      var val = el("text", { x: bx + bw / 2, y: by - 10, "text-anchor": "middle" }, "pl-val");
      val.textContent = v;
      svg.appendChild(val);
      var lab = el("text", { x: bx + bw / 2, y: h - 14, "text-anchor": "middle" }, "pl-tx");
      lab.textContent = labels[i];
      svg.appendChild(lab);
    });

    svg.appendChild(el("line", { x1: padL, y1: padT + innerH, x2: w - padR, y2: padT + innerH }, "pl-axis"));
    host.appendChild(svg);
  }

  /* --------------------------------------------------------
     Данные
     -------------------------------------------------------- */
  var PROGRESS = [45, 58, 67, 78, 85];
  var MONTHS = {
    ru: ["Сен", "Окт", "Ноя", "Дек", "Янв"],
    kz: ["Қыр", "Қаз", "Қар", "Жел", "Қаң"]
  };
  var ACCURACY = [42, 55, 58, 79, 84];

  /* строки кабинета учителя: [имя, уровень, прогресс, ключ слабой темы, активность] */
  var DESK = [
    [
      ["Айсұлу Ә.", "good", 78, "an.p3.t2", "high"],
      ["Данияр К.", "high", 91, "an.p3.t3", "high"],
      ["Мадина С.", "mid", 63, "an.p3.t2", "mid"],
      ["Ерасыл Т.", "low", 41, "an.p3.t1", "low"],
      ["Алина В.", "mid", 58, "an.p3.t4", "mid"],
      ["Тимур Ж.", "low", 37, "an.p3.t2", "low"]
    ],
    [
      ["Айсұлу Ә.", "high", 88, "an.p3.t4", "high"],
      ["Данияр К.", "mid", 62, "an.p3.t4", "mid"],
      ["Мадина С.", "good", 74, "an.p3.t2", "high"],
      ["Ерасыл Т.", "mid", 55, "an.p3.t4", "mid"],
      ["Алина В.", "high", 93, "an.p3.t3", "high"],
      ["Тимур Ж.", "low", 44, "an.p3.t4", "low"]
    ],
    [
      ["Айсұлу Ә.", "mid", 66, "an.p3.t2", "mid"],
      ["Данияр К.", "good", 79, "an.p3.t1", "high"],
      ["Мадина С.", "mid", 61, "an.p3.t3", "mid"],
      ["Ерасыл Т.", "low", 39, "an.p3.t2", "low"],
      ["Алина В.", "good", 76, "an.p3.t2", "high"],
      ["Тимур Ж.", "mid", 57, "an.p3.t1", "mid"]
    ]
  ];
  var KPI = [
    ["72%", "24 / 28", "6"],
    ["76%", "26 / 28", "4"],
    ["68%", "21 / 28", "7"]
  ];
  var LVL_KEY = { high: "tea.lvl.high", good: "tea.lvl.good", mid: "tea.lvl.mid", low: "tea.lvl.low" };
  var ACT_KEY = { high: "tea.act.high", mid: "tea.act.mid", low: "tea.act.low" };

  /* --------------------------------------------------------
     Отрисовка всего, что зависит от языка
     -------------------------------------------------------- */
  var heroDrawn = false;

  function renderPlots() {
    var lang = window.getCurrentLang();
    var t = window.t;

    plotLine(document.getElementById("heroPlot"), {
      values: PROGRESS,
      labels: [t("hero.axis1"), t("hero.axis2"), t("hero.axis3"), t("hero.axis4"), t("hero.axis5")],
      unit: "",
      height: 350,
      animate: !heroDrawn,
      aria: t("hero.plot.caption") + ": " + PROGRESS.join(", ")
    });
    heroDrawn = true;

    plotLine(document.getElementById("anProgress"), {
      values: PROGRESS,
      labels: MONTHS[lang] || MONTHS.ru,
      height: 300,
      aria: t("an.p1") + ": " + PROGRESS.join(", ")
    });

    plotBars(document.getElementById("taskPlot"), {
      values: ACCURACY,
      labels: [t("crs.task.m1"), t("crs.task.m2"), t("crs.task.m3"), t("crs.task.m4"), t("crs.task.m5")],
      height: 320,
      aria: t("crs.task.title") + ": " + ACCURACY.join(", ") + " " + t("crs.task.unit")
    });
  }

  function renderDesk() {
    var body = document.getElementById("deskRows");
    if (!body) return;
    var t = window.t;
    var idx = parseInt(document.getElementById("fSubject").value, 10) || 0;
    var shift = parseInt(document.getElementById("fPeriod").value, 10) || 0;

    body.textContent = "";
    DESK[idx].forEach(function (row) {
      var progress = shift ? Math.min(99, row[2] + 6) : row[2];
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row[0] + "</td>" +
        '<td><span class="cell-lvl"><span class="lvl lvl-' + row[1] + '"></span>' + t(LVL_KEY[row[1]]) + "</span></td>" +
        '<td><span class="mini"><span class="mini-bar"><i style="width:' + progress + '%"></i></span>' + progress + "%</span></td>" +
        "<td>" + t(row[3]) + "</td>" +
        '<td class="' + (row[4] === "low" ? "act-low" : "") + '">' + t(ACT_KEY[row[4]]) + "</td>";
      body.appendChild(tr);
    });

    document.getElementById("kpi1").textContent = KPI[idx][0];
    document.getElementById("kpi2").textContent = KPI[idx][1];
    document.getElementById("kpi3").textContent = KPI[idx][2];
  }

  function renderFaq() {
    var host = document.getElementById("faqList");
    if (!host) return;
    var t = window.t;
    var openIndex = 0;
    var current = host.querySelector('.faq-q[aria-expanded="true"]');
    if (current) openIndex = parseInt(current.dataset.i, 10);

    host.textContent = "";
    for (var i = 1; i <= 13; i++) {
      var item = document.createElement("div");
      item.className = "faq-item";
      var open = i - 1 === openIndex;
      item.innerHTML =
        '<button type="button" class="faq-q" data-i="' + (i - 1) + '" aria-expanded="' + open + '" aria-controls="fa' + i + '">' +
        "<span>" + t("faq.q" + i) + "</span>" +
        '<svg class="faq-ico" aria-hidden="true"><use href="#i-plus"></use></svg>' +
        "</button>" +
        '<div class="faq-a' + (open ? " is-open" : "") + '" id="fa' + i + '"><p>' + t("faq.a" + i) + "</p></div>";
      host.appendChild(item);
    }
  }

  /* --------------------------------------------------------
     Демонстрация разбора ответа AI
     -------------------------------------------------------- */
  function initAiDemo() {
    var demo = document.getElementById("aiDemo");
    var out = document.getElementById("aiOut");
    if (!demo || !out) return;
    var picked = null;

    demo.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        demo.querySelectorAll(".opt").forEach(function (b) { b.classList.remove("is-right", "is-wrong"); });
        var right = btn.dataset.correct === "1";
        btn.classList.add(right ? "is-right" : "is-wrong");
        picked = btn;
        paint();
      });
    });

    function paint() {
      if (!picked) return;
      var t = window.t;
      var right = picked.dataset.correct === "1";
      out.innerHTML =
        '<p class="verdict ' + (right ? "verdict-ok" : "verdict-no") + '">' +
        (right ? t("v.ok") : t("v.no")) + "</p><p>" + t(picked.dataset.key) + "</p>";
    }

    window.addEventListener("languageChanged", function () {
      if (picked) paint();
      else out.innerHTML = '<p class="demo-idle">' + window.t("ai.demo.hint") + "</p>";
    });
  }

  /* --------------------------------------------------------
     Практическое задание курса
     -------------------------------------------------------- */
  function initTask() {
    var opts = document.getElementById("taskOpts");
    var out = document.getElementById("taskOut");
    var check = document.getElementById("taskCheck");
    var hint = document.getElementById("taskHint");
    if (!opts || !out) return;
    var picked = null;
    var state = null; /* "hint" | "ok" | "no" */

    opts.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        opts.querySelectorAll(".opt").forEach(function (b) {
          b.classList.remove("is-picked", "is-right", "is-wrong");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("is-picked");
        btn.setAttribute("aria-checked", "true");
        picked = btn;
      });
    });

    check.addEventListener("click", function () {
      if (!picked) { state = "hint"; paint(); return; }
      var right = picked.dataset.correct === "1";
      picked.classList.remove("is-picked");
      picked.classList.add(right ? "is-right" : "is-wrong");
      state = right ? "ok" : "no";
      paint();
    });

    hint.addEventListener("click", function () { state = "hint"; paint(); });

    function paint() {
      var t = window.t;
      if (state === "hint") { out.innerHTML = '<p class="task-hint">' + t("crs.task.hint") + "</p>"; return; }
      if (state === "ok") { out.innerHTML = '<p class="verdict verdict-ok">' + t("v.ok") + "</p><p>" + t("crs.task.ok") + "</p>"; return; }
      if (state === "no") { out.innerHTML = '<p class="verdict verdict-no">' + t("v.no") + "</p><p>" + t("crs.task.no") + "</p>"; }
    }

    window.addEventListener("languageChanged", function () { if (state) paint(); });
  }

  /* --------------------------------------------------------
     Счётчики
     -------------------------------------------------------- */
  function initCounters() {
    var host = document.getElementById("nums");
    if (!host || !("IntersectionObserver" in window)) return;
    var done = false;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done) return;
        done = true;
        io.disconnect();
        host.querySelectorAll(".num").forEach(function (node) {
          var to = parseInt(node.dataset.to, 10);
          var suffix = node.dataset.suffix || "";
          if (reduced) { node.textContent = format(to) + suffix; return; }
          var start = performance.now();
          var dur = 1100;
          (function step(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = format(Math.round(to * eased)) + suffix;
            if (p < 1) requestAnimationFrame(step);
          })(start);
        });
      });
    }, { threshold: 0.35 });

    io.observe(host);

    function format(n) { return n.toLocaleString("ru-RU"); }
  }

  /* --------------------------------------------------------
     FAQ
     -------------------------------------------------------- */
  function initFaq() {
    var host = document.getElementById("faqList");
    if (!host) return;
    host.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq-q");
      if (!btn) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      host.querySelectorAll(".faq-q").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      host.querySelectorAll(".faq-a").forEach(function (a) { a.classList.remove("is-open"); });
      if (!open) {
        btn.setAttribute("aria-expanded", "true");
        document.getElementById(btn.getAttribute("aria-controls")).classList.add("is-open");
      }
    });
  }

  /* --------------------------------------------------------
     Модалка
     -------------------------------------------------------- */
  function initModal() {
    var modal = document.getElementById("demo");
    if (!modal) return;
    var form = document.getElementById("modalForm");
    var done = document.getElementById("modalDone");
    var last = null;

    document.querySelectorAll("[data-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        last = btn;
        form.hidden = false;
        done.hidden = true;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        var first = modal.querySelector("input, select") || modal.querySelector("button");
        if (first) first.focus();
      });
    });

    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (last) last.focus();
    }

    modal.querySelectorAll("[data-close]").forEach(function (n) { n.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var focusables = modal.querySelectorAll("button, input, select, a[href]");
      var list = Array.prototype.filter.call(focusables, function (n) { return n.offsetParent !== null; });
      if (!list.length) return;
      var first = list[0], lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });

    document.getElementById("demoForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
      form.hidden = true;
      done.hidden = false;
      done.querySelector("button").focus();
    });
  }

  /* --------------------------------------------------------
     Шапка и язык
     -------------------------------------------------------- */
  function initHead() {
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");
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

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { window.setLanguage(btn.dataset.lang); });
    });
  }

  /* --------------------------------------------------------
     Старт
     -------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initHead();
    initAiDemo();
    initTask();
    initCounters();
    initFaq();
    initModal();

    var ring = document.getElementById("stuRing");
    if (ring) ring.style.setProperty("--p", "78%");

    document.getElementById("fSubject").addEventListener("change", renderDesk);
    document.getElementById("fPeriod").addEventListener("change", renderDesk);

    window.addEventListener("languageChanged", function () {
      renderPlots();
      renderDesk();
      renderFaq();
    });

    /* setLanguage подставит тексты и вызовет languageChanged,
       который отрисует таблицу, FAQ и графики */
    window.setLanguage(window.getCurrentLang());

    var onResize;
    window.addEventListener("resize", function () {
      clearTimeout(onResize);
      onResize = setTimeout(renderPlots, 180);
    });
  });
})();
