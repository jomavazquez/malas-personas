import { useTranslation } from "react-i18next";
import { BlackCardText, C } from "../../../lib";
import styles from "./FloatingQuestion.module.css";

interface Props {
    left?: number;
    top?: number;
}

export const FloatingQuestion = ({ left = 60, top = 0 }: Props) => {

    const { t } = useTranslation();

    return (
        <div className={`animate-floaty ${ styles.floaty }`} style={{ top, left, background: C.base }}>
            <div className={ styles.floating_title }>
                <BlackCardText text={ t("hero.sampleQuestion") } />
            </div>
            <div className={ styles.floating_question } style={{ color: C.accent }}>{ t("hero.question") }</div>
        </div>
    )
}