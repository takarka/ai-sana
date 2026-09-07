/* ============================================================
   CRAFT AI — Скрипт страницы CRAFT MATRIX (page-matrix.js)
   Пошаговый сценарий урока: шаги 01 → 02 → 03 переключаются
   кликом всегда и по скроллу на десктопе.
   ============================================================ */

(function () {
  "use strict";

  var current = -1;
  var navBtns = [];
  var panes = [];

  function setStep(idx) {
    if (idx === current) return;
    current = idx;
    navBtns.forEach(function (btn, i) {
      btn.classList.toggle("is-on", i === idx);
      /* aria-selected допустим только на role="tab"; здесь это шаги,
         поэтому состояние передаём через aria-current */
      if (i === idx) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });
    panes.forEach(function (pane, i) {
      pane.classList.toggle("is-on", i === idx);
    });
  }

  function initHowScrub() {
    var stage = document.getElementById("howStage");
    if (!stage) return;

    navBtns = [].slice.call(stage.querySelectorAll(".how__nav button"));
    panes = [].slice.call(stage.querySelectorAll(".how__pane"));
    if (!navBtns.length || !panes.length) return;

    navBtns.forEach(function (btn, idx) {
      btn.addEventListener("click", function () { setStep(idx); });
    });

    setStep(0);

    /* Скролл-сценарий. GSAP грузится с async, поэтому ждём его через
       CRAFT.whenGsap — раньше здесь стояла проверка window.gsap прямо
       на DOMContentLoaded, и ScrollTrigger не создавался никогда.
       matchMedia сам включает и выключает эффект при ресайзе. */
    if (!window.CRAFT || !window.CRAFT.whenGsap) return;

    window.CRAFT.whenGsap(function (gsap, ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.matchMedia().add("(min-width: 1024px)", function () {
        var trigger = ScrollTrigger.create({
          trigger: "#how",
          start: "top 30%",
          end: "bottom 70%",
          onUpdate: function (self) {
            var i = Math.min(panes.length - 1, Math.floor(self.progress * panes.length));
            setStep(i);
          }
        });

        return function () {
          trigger.kill();
          setStep(0);
        };
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHowScrub();

    if (window.CRAFT && window.CRAFT.bootScene) {
      window.CRAFT.bootScene();
    }
  });
})();
