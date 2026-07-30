import { C } from "../../../lib";
import { Dot } from "../../../components";
import styles from "./Badge.module.css";

interface BadgeProps {
    children: React.ReactNode;
    color?: string;
    dot?: boolean;
    marginBottom?: number;
    fadeIn?: boolean;
}

export const Badge = ({ children, color = C.accent, dot = true, marginBottom = 20, fadeIn = false }: BadgeProps) => (
    <div
        className={ `${ styles.badge_stick } ${ fadeIn ? styles.badge_fade_in : "" }` }
        style={{
            background: `color-mix(in srgb, ${ color } 14%, #ffffff)`,
            border: `1px solid color-mix(in srgb, ${ color } 40%, transparent)`,
            marginBottom
        }}
    >
        {
            dot && <Dot color={ color } />
        }
        <span className={ styles.badge_label } style={{ color: C.accentDeep }}>
            { children }
        </span>
    </div>
);