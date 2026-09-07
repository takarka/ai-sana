/* ============================================================
   CRAFT AI — Базовый скрипт (core.js)
   Прелоадер, шапка/бургер, модальное окно, анимации,
   инициализация параметризованной WebGL-сцены
   ============================================================ */

(function () {
  "use strict";

  /* Абсолютный URL scene.js, вычисленный от адреса самого core.js.
     document.currentScript доступен только во время выполнения скрипта,
     поэтому считаем его сразу, а не внутри bootScene().
     Абсолютный URL нужен потому, что относительный спецификатор в import()
     из классического скрипта резолвится от базы скрипта, а не документа —
     и сайт может лежать не в корне домена. */
  var SCENE_URL = (function () {
    var self = document.currentScript;
    if (self && self.src) return new URL("../scene.js", self.src).href;
    return new URL("scene.js", document.baseURI).href;
  })();

  var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = rmq.matches;

  function onReducedChange() {
    reduced = rmq.matches;
    if (reduced) freezeMotion();
  }
  if (rmq.addEventListener) rmq.addEventListener("change", onReducedChange);
  else if (rmq.addListener) rmq.addListener(onReducedChange);

  function freezeMotion() {
    document.querySelectorAll(".js-rise, .js-fade, .js-split").forEach(function (n) {
      n.classList.add("is-in");
    });
    document.querySelectorAll(".word").forEach(function (w) { w.classList.add("is-lit"); });
    if (window.__scene) { window.__scene.dispose(); window.__scene = null; }
  }

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

  /* ==========================================================
     1. WORD-MASK СПЛИТТЕР
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
     2. ПРЕЛОАДЕР
     ========================================================== */
  function initPreloader(done) {
    var pre = document.getElementById("pre");
    var pct = document.getElementById("prePct");
    var bar = document.getElementById("preBar");
    if (!pre || reduced) { if (pre) pre.remove(); done(); return; }

    var CAP = 1100;
    var MIN = 400;
    var t0 = Date.now();
    var ready = false;
    var finished = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { ready = true; });

    var tick = setInterval(function () {
      var e = Date.now() - t0;
      var p = ready ? Math.min(1, e / MIN) : Math.min(0.92, e / CAP);
      paint(Math.round(p * 100));
      if ((ready && e >= MIN) || e >= CAP) finish();
    }, 40);

    setTimeout(finish, CAP + 600);

    function paint(v) {
      if (pct) pct.textContent = v;
      if (bar) bar.style.width = (6 + v * 0.34) + "rem";
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
      }, 120);
    }
  }

  /* ==========================================================
     3. ШАПКА, БУРГЕР И НАВИГАЦИЯ
     ========================================================== */
  function initHead() {
    var head = document.getElementById("head");
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");

    if (head) {
      var onScroll = function () {
        head.classList.toggle("is-stuck", window.scrollY > 30);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });

      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* Подсветка активной страницы в меню */
    var path = window.location.pathname.split("/").pop() || "index.html";
    if (nav) {
      nav.querySelectorAll("a").forEach(function (a) {
        var href = a.getAttribute("href") || "";
        if (href === path || (path === "" && href === "index.html") || (path === "index.html" && href === "index.html")) {
          a.classList.add("is-active");
        }
      });
    }

    /* Переключатели языков */
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        if (window.setLanguage) window.setLanguage(b.dataset.lang);
      });
    });
  }

  /* ==========================================================
     4. МОДАЛКА ЗАЯВКИ
     ========================================================== */
  function initModal() {
    var modal = document.getElementById("modal");
    if (!modal) return;

    var formBox = document.getElementById("modalForm");
    var doneBox = document.getElementById("modalDone");
    var form = document.getElementById("demoForm");
    /* Всё, что не модалка, прячем от AT и клавиатуры, пока она открыта */
    var outside = [].slice.call(document.querySelectorAll("body > header, body > main, body > footer"));
    var lastFocus = null;
    var scrollY = 0;

    function focusables() {
      return [].slice.call(modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return el.offsetParent !== null; });
    }

    function onKeydown(e) {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab") return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    function openModal() {
      lastFocus = document.activeElement;
      modal.classList.add("is-open");
      if (formBox) formBox.hidden = false;
      if (doneBox) doneBox.hidden = true;

      outside.forEach(function (el) { el.setAttribute("aria-hidden", "true"); el.setAttribute("inert", ""); });

      scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = -scrollY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";

      document.addEventListener("keydown", onKeydown);

      var firstInput = modal.querySelector("input");
      if (firstInput) setTimeout(function () { firstInput.focus(); }, 50);
    }

    function closeModal() {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");

      outside.forEach(function (el) { el.removeAttribute("aria-hidden"); el.removeAttribute("inert"); });

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);

      document.removeEventListener("keydown", onKeydown);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll("[data-modal]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    });

    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (formBox) formBox.hidden = true;
        if (doneBox) doneBox.hidden = false;
        form.reset();
      });
    }
  }

  /* ==========================================================
     5. РЕВИЛЫ
     ========================================================== */
  function initReveals() {
    document.querySelectorAll(".js-split").forEach(function (el) {
      var words = splitWords(el);
      words.forEach(function (w, i) {
        w.style.setProperty("--d", (i * 0.045) + "s");
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".js-rise, .js-fade, .js-reveal, .chain__rail").forEach(function (el) {
      io.observe(el);
    });
  }

  /* ==========================================================
     6. ИНИЦИАЛИЗАЦИЯ СЦЕНЫ
     ========================================================== */
  function bootScene(opts) {
    if (reduced || !hasWebGL()) return;
    if (conn && conn.saveData) return;

    var canvas = document.getElementById("scene");
    if (!canvas) return;

    opts = opts || {};
    var styles = window.getComputedStyle(document.body);
    var baseColor = styles.getPropertyValue("--on-ink-dim").trim() || "#93a2c4";
    var ridgeColor = styles.getPropertyValue("--signal-lift").trim() || "#7e8bff";

    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 400); };
    idle(function () {
      import(SCENE_URL).then(function (m) {
        window.__scene = m.initScene({
          canvas: canvas,
          base: baseColor,
          ridge: ridgeColor,
          particles: lowPower ? 12000 : 24000,
          dpr: Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2),
          onFrame: opts.onFrame
        });

        if (opts.onReady) opts.onReady(window.__scene);
      }).catch(function (err) {
        console.warn("Scene boot fallback:", err);
      });
    });
  }

  /* ==========================================================
     7. ОЖИДАНИЕ GSAP
     GSAP подключён с async, поэтому на DOMContentLoaded его
     обычно ещё нет. Ждём появления, но не дольше 3 секунд —
     если CDN недоступен, страница просто остаётся без скраба.
     ========================================================== */
  function whenGsap(cb) {
    if (reduced) return;
    var t0 = Date.now();
    (function poll() {
      if (window.gsap && window.ScrollTrigger) { cb(window.gsap, window.ScrollTrigger); return; }
      if (Date.now() - t0 > 3000) return;
      setTimeout(poll, 60);
    })();
  }

  window.CRAFT = {
    splitWords: splitWords,
    whenGsap: whenGsap,
    initPreloader: initPreloader,
    initHead: initHead,
    initModal: initModal,
    initReveals: initReveals,
    bootScene: bootScene,
    reduced: function () { return reduced; }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initPreloader(function () {
      initHead();
      initModal();
      initReveals();
    });
  });

  window.addEventListener("languageChanged", function () {
    /* Обновление ревилов для новых слов */
    document.querySelectorAll(".js-split").forEach(function (el) {
      splitWords(el);
    });
  });
})();
