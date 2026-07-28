import { useTranslation } from "react-i18next";
import { C } from "../../../../lib";
import type { VomStatement, VomPlayer } from "../../../../types";
import styles from "./v_o_m.module.css";

interface Props {
  statements: VomStatement[];
  players: VomPlayer[];
  protagonistUserId: string;
}

export const ProtagonistWaitingView = ({ statements, players, protagonistUserId }: Props) => {

  const { t } = useTranslation();
  const voters = players.filter((p) => !p.isSpectator && p.userId !== protagonistUserId);
  const votedCount = voters.filter((p) => p.status === "voted").length;

  return (
    <div className={ styles.card }>
      <div className={ styles.title } style={{ color: C.base }}>{ t("vom.everyoneIsVoting") }</div>
      <p className={ styles.sub } style={{ color: C.muted }}>
        { t("vom.fooledExplainer") }{" "}·{" "}{ votedCount }/{ voters.length }{" "}{ t("vom.votesCast") }
      </p>
      <div className="flex flex-col gap-3">
        {
          statements.map((s) => (
            <div
              key={ s.id }
              className={ styles.statement_row }
              style={{ background: s.isLie ? "#FFF8EE" : "#fff", border: `2px solid ${ s.isLie ? C.accent : "#E4EAEA" }` }}
            >
              <span className={ styles.statement_text } style={{ color: C.base }}>{ s.text }</span>
              {
                s.isLie &&
                <span className={ styles.tag } style={{ marginLeft: "auto", background: C.accent, color: C.base }}>{ t("vom.theLie") }</span>
              }
            </div>
          ))
        }
      </div>
    </div>
  );
};