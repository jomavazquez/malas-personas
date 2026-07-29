import { useTranslation } from "react-i18next";
import { PillToggle } from "../../../components";

const STORAGE_KEY = "mp_language";

const LANGUAGES = [
  { value: "es", label: "Español", shortLabel: "ES" },
  { value: "en", label: "English", shortLabel: "EN" },
];

export const LanguageSelector = () => {

    const { i18n } = useTranslation();
    const activeLang = i18n.language.startsWith("es") ? "es" : "en";

    const handleChange = (code: string) => {
        localStorage.setItem( STORAGE_KEY, code );
        i18n.changeLanguage( code );
    };

    return (
        <PillToggle
            options={ LANGUAGES }
            value={ activeLang }
            onChange={ handleChange }
        />
    );
};