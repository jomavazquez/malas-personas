import { C } from "../../../lib";
import styles from "./Badge.module.css";

interface BadgeProps {
    children: React.ReactNode;
    color?: string;
    dot?: boolean;
    marginBottom?: number;
}

export const Badge = ({ children, color = C.accent, dot = true, marginBottom = 20 }: BadgeProps) => (
    <div 
        className={ styles.badge_stick }
        style={{
            background: `color-mix(in srgb, ${ color } 14%, #ffffff)`,
            border: `1px solid color-mix(in srgb, ${ color } 40%, transparent)`,
            marginBottom
        }}
    >
        {
            dot && 
            <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, display: "inline-block" }} />
        }
        <span className={ styles.badge_label } style={{ color: C.accentDeep }}>
            { children }
        </span>
    </div>
);