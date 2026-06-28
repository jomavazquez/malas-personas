import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../../../hooks";
import { C, F } from "../../../lib";
import { Dot } from "./Dot";

const STORAGE_KEY = "mp_language";

const LANGUAGES = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
] as const;

export const LanguageSelector = () => {
    
    const { i18n } = useTranslation();
    const isMobile = useIsMobile();
    const activeLang = i18n.language.startsWith("es") ? "es" : "en";
    const activeIndex = LANGUAGES.findIndex( (l) => l.code === activeLang );

    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [ pillStyle, setPillStyle ] = useState({ left: 5, width: 0 });

    useEffect(() => {
        const btn = btnRefs.current[activeIndex];
        if( btn ) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }, [ activeIndex, isMobile ]);

    const handleChange = (code: string) => {
        localStorage.setItem( STORAGE_KEY, code );
        i18n.changeLanguage( code );
    };

    return (
        <div
            className="relative flex items-center rounded-full px-1 py-1"
            style={{ background: "rgba(47, 52, 58, 0.07)" }}
        >
        <div
            className="absolute top-1 bottom-1 rounded-full transition-all duration-200 ease-in-out"
            style={{ left: pillStyle.left, width: pillStyle.width, background: "#fff", boxShadow: "0 1px 4px rgba(47, 52, 58, 0.12)" }}
        />
        {
            LANGUAGES.map(({ code, label, short }, i) => {
                const isActive = activeLang === code;
                return (
                    <button
                        key={ code }
                        ref={ (el) => { btnRefs.current[i] = el; } }
                        onClick={ () => handleChange(code) }
                        className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-200 z-10"
                        style={{
                            fontFamily: F.display,
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 13,
                            color: isActive ? C.base : C.muted,
                            background: "transparent",
                            border: "none",
                            cursor: isActive ? "default" : "pointer",
                        }}
                    >
                        {
                            isActive && <Dot size={ 6 } />
                        }
                        {
                            isMobile ? short : label
                        }
                    </button>
                );
            })}
        </div>
    );
};