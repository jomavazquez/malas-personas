import { useTranslation } from "react-i18next";
import { BlackCardText, C } from "../../lib";
import styles from "./BlackCard.module.css";

interface Props {
    question: string;
    showSub?: boolean;
    fontSize?: number;
}

export const BlackCard = ({ question, showSub = false, fontSize = 22 }: Props ) => {

    const { t } = useTranslation();
    
    return (
        <div className={ styles.black_card }>
            <div className={ styles.black_card_question } style={{ fontSize }}>
                <BlackCardText text={ question } />
            </div>
            {
                showSub &&
                <span className={ styles.black_card_sub } style={{ color: C.accent }}>
                    { t("game.roundQuestion") }
                </span>
            }
        </div>
    )
}