import type { ReactNode } from "react";
import { C } from "../../../lib";
import styles from "./StepCard.module.css";

interface Props {
    number: number;
    title: string;
    description: string;
    children?: ReactNode;
}

export const StepCard = ({ number, title, description, children }: Props) => (
    <div className={ styles.sc } style={{ background: C.surface }}>
        <div className={ styles.sn } style={{ color: C.accent }}>{ number }</div>
        <div className={ styles.st } style={{ color: C.base }}>{ title }</div>
        <div className={ styles.sb } style={{ color: C.muted }}>{ description }</div>
        { children }
    </div>
);