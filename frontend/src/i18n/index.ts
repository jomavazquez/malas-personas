import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// index.html ships with lang="en"; keep it in sync with the language actually shown.
// Registered before init() so the initial detected language is applied too.
i18n.on("languageChanged", ( lng ) => {
  document.documentElement.lang = lng;
});

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ns: ["translation"],
    defaultNS: "translation",
    backend: { loadPath: "/assets/lang/{{lng}}/{{ns}}.json" },
    fallbackLng: "en",
    supportedLngs: ["es", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "mp_language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
