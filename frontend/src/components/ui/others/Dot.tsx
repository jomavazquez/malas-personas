import { C } from "../../../lib";
import styles from "./Dot.module.css";

interface Props {
    size?: number;
    color?: string
}

export const Dot = ({ size = 7, color = C.accent }: Props) => {
    return (
        <span 
            className={ styles.sidebar_dot } 
            style={{ 
                background: color,
                height: size,
                width: size
            }}
        />
    )
}