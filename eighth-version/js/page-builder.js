/* ============================================================
   CRAFT AI — Скрипт страницы CRAFT BUILDER (page-builder.js)
   Интерактивный тренажёр промпт-инжиниринга
   ============================================================ */

(function () {
  "use strict";

  function initPromptBuilder() {
    var outCode = document.getElementById("lzCode");
    var scoreEl = document.getElementById("lzScore");
    var chips = document.querySelectorAll(".lz-chip");
    var checkBtn = document.getElementById("lzCheck");
    var verdictList = document.getElementById("lzVerdict");

    if (!outCode || !chips.length) return;

    var activeChips = {
      role: false,
      format: false,
      cases: false,
      noise: false
    };

    function updatePrompt() {
      var lang = window.getCurrentLang ? window.getCurrentLang() : "ru";
      var parts = [];

      if (lang === "kz") {
        if (activeChips.role) {
          parts.push("Тәжірибелі frontend-инженер және оқушы жобаларының менторы ретінде әрекет ет.");
        }
        parts.push("Мектептің ғылыми жобасы үшін интерактивті веб-сайт жасап бер.");
        if (activeChips.format) {
          parts.push("Техникалық талап: Таза HTML/CSS, семантикалық белгілеу және мобильді құрылғыларға бейімделу.");
        }
        if (activeChips.cases) {
          parts.push("Шекті сценарийлер: Бос деректерді өңдеуді және деректер дұрыс енгізілмегенде қателерді көрсетуді қамтамасыз ет.");
        }
        if (activeChips.noise) {
          parts.push("Бәріне қатты ұнайтындай, өте әдемі және ерекше стильде болсын.");
        }
      } else {
        if (activeChips.role) {
          parts.push("Действуй как опытный frontend-инженер и ментор школьных IT-проектов.");
        }
        parts.push("Сделай сайт для школьного научного проекта.");
        if (activeChips.format) {
          parts.push("Технический стек: Чистый семантический HTML/CSS, строгая модульная структура и адаптивная верстка.");
        }
        if (activeChips.cases) {
          parts.push("Краевые сценарии: Предусмотри обработку пустого ввода и вывод понятных сообщений об ошибках.");
        }
        if (activeChips.noise) {
          parts.push("И сделай так, чтобы всем очень понравилось и было максимально красиво.");
        }
      }

      outCode.textContent = parts.join(" ");

      /* Оценка */
      var points = 25;
      if (activeChips.role) points += 25;
      if (activeChips.format) points += 25;
      if (activeChips.cases) points += 25;
      if (activeChips.noise) points -= 15;
      points = Math.max(15, Math.min(100, points));

      if (scoreEl) {
        if (points >= 80) {
          scoreEl.style.color = "var(--lvl-high)";
          scoreEl.textContent = window.t ? window.t("builder.lz.score.high") : "Качество: 95% — Высокое";
        } else if (points >= 50) {
          scoreEl.style.color = "var(--lvl-mid)";
          scoreEl.textContent = window.t ? window.t("builder.lz.score.mid") : "Качество: 65% — Среднее";
        } else {
          scoreEl.style.color = "var(--lvl-low)";
          scoreEl.textContent = window.t ? window.t("builder.lz.score.low") : "Качество: 25% — Низкое";
        }
      }

      /* Вердикт */
      if (verdictList) {
        var items = verdictList.querySelectorAll("li");
        if (items[0]) {
          items[0].className = activeChips.role ? "is-ok" : "is-no";
        }
        if (items[1]) {
          items[1].className = activeChips.format ? "is-ok" : "is-no";
        }
        if (items[2]) {
          items[2].className = activeChips.cases ? "is-ok" : "is-no";
        }
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = chip.dataset.chip;
        activeChips[key] = !activeChips[key];
        chip.classList.toggle("is-on", activeChips[key]);
        updatePrompt();
      });
    });

    if (checkBtn) {
      checkBtn.addEventListener("click", function () {
        updatePrompt();
      });
    }

    updatePrompt();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPromptBuilder();

    if (window.CRAFT && window.CRAFT.bootScene) {
      window.CRAFT.bootScene();
    }
  });

  window.addEventListener("languageChanged", function () {
    initPromptBuilder();
  });
})();
