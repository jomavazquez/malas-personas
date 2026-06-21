import { C } from "../../../lib";
import styles from "./Badge.module.css";

interface BadgeProps {
    children: React.ReactNode;
}

export const Badge = ({ children }: BadgeProps) => (
    <div 
        className={ styles.badge_stick }
        style={{
            background: `color-mix(in srgb, ${ C.accent } 14%, #ffffff)`,
            border: `1px solid color-mix(in srgb, ${ C.accent } 40%, transparent)`,
        }}
    >
        <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, display: "inline-block" }} />
        <span className={ styles.badge_label } style={{ color: C.accentDeep }}>
            { children }
        </span>
    </div>
);