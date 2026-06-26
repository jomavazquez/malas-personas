import { t } from "i18next";
import { BlackCardText, C } from "../../lib";
import styles from "./BlackCard.module.css";

interface Props {
    question: string;
}

export const BlackCard = ({ question }: Props ) => {
    
    return (
        <div className={ styles.black_card }>
            <div className={ styles.black_card_question }>
                <BlackCardText text={ question } />
            </div>
            <span className={ styles.black_card_sub } style={{ color: C.accent }}>
                { t("game.roundQuestion") }
            </span>
        </div>
    )
}