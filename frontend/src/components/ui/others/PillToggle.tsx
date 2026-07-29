import { useRef, useLayoutEffect, useState } from "react";
import { useIsMobile } from "../../../hooks";
import { C } from "../../../lib";
import { Dot } from "../../../components";
import styles from "./PillToggle.module.css";

interface PillOption {
    value: string;
    label: string;
    shortLabel?: string;
    badge?: string;
}

interface Props {
    options: PillOption[];
    value: string;
    onChange: (value: string) => void;
    showActiveDot?: boolean;
}

export const PillToggle = ({ options, value, onChange, showActiveDot = true }: Props) => {

    const isMobile = useIsMobile();
    const activeIndex = options.findIndex( (o) => o.value === value );

    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [ pillStyle, setPillStyle ] = useState({ left: 5, width: 0 });

    const labelsKey = options.map( (o) => `${ o.label }|${ o.shortLabel ?? "" }` ).join( "," );

    useLayoutEffect(() => {
        const measure = () => {
            const btn = btnRefs.current[activeIndex];
            if( btn ) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
        };
        measure();
        document.fonts?.ready.then( measure );
    }, [ activeIndex, isMobile, options.length, labelsKey ]);

    return (
        <div className="relative inline-flex items-center rounded-full px-1 py-1" style={{ background: "rgba(47, 52, 58, 0.07)" }}>
        <div 
            className={`absolute top-1 bottom-1 rounded-full transition-all duration-200 ease-in-out ${styles.bg_white}`}
            style={{ left: pillStyle.left, width: pillStyle.width }}
        />
        {
            options.map(( opt, i ) => {
                const isActive = opt.value === value;
                return (
                    <button
                        key={ opt.value }
                        ref={ (el) => { btnRefs.current[i] = el; } }
                        onClick={ () => onChange(opt.value) }
                        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-200 z-10 ${styles.btn}`}
                        style={{
                            color: isActive ? C.base : C.muted,
                            cursor: isActive ? "default" : "pointer",
                            fontWeight: isActive ? 700 : 500
                        }}
                    >
                        {
                            isActive && showActiveDot && !opt.badge && <Dot size={ 6 } />
                        }
                        {
                            isMobile && opt.shortLabel ? opt.shortLabel : opt.label
                        }
                        {
                            opt.badge &&
                            <span
                                className={`rounded-full uppercase ${styles.badge}`}
                                style={{ color: C.base, background: C.accent }}
                            >
                                { opt.badge }
                            </span>
                        }
                    </button>
                );
            })
        }
        </div>
    );
};