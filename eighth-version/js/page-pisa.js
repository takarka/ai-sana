/* ============================================================
   CRAFT AI — Скрипт страницы CRAFT PISA (page-pisa.js)
   Рукописные inline SVG-графики для управленческого дашборда
   ============================================================ */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

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
    var h = Math.round((opts.height || 280) * (sparse ? 0.85 : 1));
    var padL = 40, padR = 30, padT = 36, padB = 44;
    var min = 30, max = 100;

    host.textContent = "";
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img" });
    svg.setAttribute("aria-label", opts.aria || "");

    var iw = w - padL - padR, ih = h - padT - padB;
    var x = function (i) { return padL + (iw * i) / (values.length - 1); };
    var y = function (v) { return padT + ih - (ih * (v - min)) / (max - min); };

    [40, 60, 80, 100].forEach(function (tv) {
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
      svg.appendChild(el("circle", { cx: x(i), cy: y(v), r: 5 }, "pl-dot"));
      var anchor = i === 0 ? "start" : (i === values.length - 1 ? "end" : "middle");
      var val = el("text", { x: x(i), y: y(v) - 14, "text-anchor": anchor }, "pl-val");
      val.textContent = v + "%";
      svg.appendChild(val);
      if (labels[i] && (!sparse || i === 0 || i === values.length - 1)) {
        var lab = el("text", { x: x(i), y: h - 14, "text-anchor": anchor }, "pl-tx");
        lab.textContent = labels[i];
        svg.appendChild(lab);
      }
    });

    host.appendChild(svg);

    var len = path.getTotalLength();
    path.style.setProperty("--len", len);
    path.classList.add("is-drawing");
  }

  function renderPisaCharts() {
    var chartHost = document.getElementById("pisaChart");
    if (!chartHost) return;

    var lang = window.getCurrentLang ? window.getCurrentLang() : "ru";
    var labels = lang === "kz" ?
      ["Бастапқы", "1-тоқсан", "2-тоқсан", "3-тоқсан", "PISA-2029 болжамы"] :
      ["Входной", "1 четверть", "2 четверть", "3 четверть", "Прогноз 2029"];

    plotLine(chartHost, {
      values: [48, 59, 68, 79, 88],
      labels: labels,
      aria: "Динамика готовности параллелей школы к PISA-2029"
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderPisaCharts();

    if (window.CRAFT && window.CRAFT.bootScene) {
      window.CRAFT.bootScene();
    }
  });

  window.addEventListener("resize", function () {
    renderPisaCharts();
  });

  window.addEventListener("languageChanged", function () {
    renderPisaCharts();
  });
})();
