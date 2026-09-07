/* ============================================================
   CRAFT AI — Ядро локализации (i18n)
   Поддерживает модульную регистрацию словарей:
   common.js + страничные словари (home.js, matrix.js и др.)
   Хранилище: craft_lang (localStorage)
   ============================================================ */

(function () {
  "use strict";

  const LANG_KEY = "craft_lang";
  let currentLang = localStorage.getItem(LANG_KEY) || "ru";

  const translations = {
    ru: {},
    kz: {}
  };

  function registerDict(lang, dict) {
    if (!translations[lang]) translations[lang] = {};
    Object.assign(translations[lang], dict);
    if (lang === currentLang) {
      applyTranslations();
    }
  }

  function t(key) {
    const dict = translations[currentLang] || translations.ru;
    if (dict && dict[key] !== undefined) return dict[key];
    if (translations.ru && translations.ru[key] !== undefined) return translations.ru[key];
    return key;
  }

  function getCurrentLang() {
    return currentLang;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const v = t(key);
      if (v) el.textContent = v;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-html");
      const v = t(key);
      if (v) el.innerHTML = v;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      const v = t(key);
      if (v) el.setAttribute("placeholder", v);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-aria");
      const v = t(key);
      if (v) el.setAttribute("aria-label", v);
    });
  }

  /* Подсветка активной кнопки языка. Нужна не только при переключении,
     но и на первой отрисовке: в разметке жёстко активна RU, и если в
     localStorage лежит kz, страница открывалась на казахском с
     подсвеченной кнопкой RU. */
  function syncLangButtons() {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(lang) {
    if (lang !== "ru" && lang !== "kz") return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";

    applyTranslations();
    syncLangButtons();

    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: lang } }));
  }

  window.translations = translations;
  window.registerDict = registerDict;
  window.t = t;
  window.getCurrentLang = getCurrentLang;
  window.setLanguage = setLanguage;
  window.applyTranslations = applyTranslations;

  document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.lang = currentLang === "kz" ? "kk" : "ru";
    applyTranslations();
    syncLangButtons();
  });
})();
