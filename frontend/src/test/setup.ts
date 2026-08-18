import "@testing-library/jest-dom/vitest";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Real (not mocked) i18next instance, initialized synchronously with the
// actual English locale resources used in production, so components under
// test render real translated text via useTranslation() instead of raw
// keys or a mocked hook. This is the same "translation" namespace/path the
// app configures in src/i18n/index.ts (public/assets/lang/{{lng}}/translation.json),
// just loaded directly instead of over HTTP.
import en from "../../public/assets/lang/en/translation.json";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["translation"],
  defaultNS: "translation",
  resources: {
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});

export default i18n;