import { useTranslation } from "react-i18next";
import { Avatar } from "../../../../components";
import { C } from "../../../../lib";
import styles from "./v_o_m.module.css";

interface Props {
  protagonistName: string;
}

export const AwaitingStatementsView = ({ protagonistName }: Props) => {

  const { t } = useTranslation();

  return (
    <div className={ styles.card }>
      <div className={ styles.waiting_box }>
        <Avatar size={ 60 } user={ protagonistName } />
        <span className={ styles.preparing_round } style={{ color: C.accent }}>
          { t("vom.preparingRound") }
        </span>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: C.base }}>
          { t("vom.playerIsInFocus", { username: protagonistName }) }
        </h2>
        <p style={{ color: C.muted, fontSize: 16, maxWidth: 380 }}>{ t("vom.awaitingSub") }</p>
        <span className="anim" style={{ color: C.faint, fontWeight: 800, fontSize: 16, marginTop: 5 }}>{ t("vom.getReadyToVote") }</span>
      </div>
    </div>
  );
};