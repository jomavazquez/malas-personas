import { useTranslation } from "react-i18next";
import { C } from "../../../lib";
import styles from "./FloatingQuestion.module.css";

interface Props {
    left?: number;
    top?: number;
}

export const FloatingQuestion = ({ left = 60, top = 0 }: Props) => {

    const { t } = useTranslation();

    return (
        <div className="animate-floaty" style={{ position: "absolute", top, left, width: 250, background: C.base, borderRadius: 20, padding: "25px", transform: "rotate(-6deg)", zIndex: 5, boxShadow: "0 30px 50px -20px rgba(47,52,58,.55)" }}>
            <div className={ styles.floating_title }>
                { t("hero.sampleQuestion") }
            </div>
            <div className={ styles.floating_question } style={{ color: C.accent }}>{ t("hero.question") }</div>
        </div>
    )
}