import { useTranslation } from "react-i18next";
import { C } from "../../../../lib";
import type { VomStatement, VomVote } from "../../../../types";
import styles from "./v_o_m.module.css";

interface Props {
  statements: VomStatement[];
  votes: VomVote[];
  fooledCount: number;
  protagonistUserId: string;
  protagonistName: string;
  myId: string;
}

export const RevealView = ({ statements, votes, fooledCount, protagonistUserId, protagonistName, myId }: Props) => {

  const { t } = useTranslation();
  const isProtagonist = myId === protagonistUserId;
  const lieStatement = statements.find((s) => s.isLie);
  const myVote = votes.find((v) => v.userId === myId);
  const gotIt = myVote && lieStatement && myVote.statementId === lieStatement.id;

  const headline = isProtagonist
    ? t("vom.youFooled", { count: fooledCount })
    : gotIt
      ? t("vom.youCaughtTheLie")
      : t("vom.youGotFooled");

  return (
    <div className={ styles.card }>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div className={ styles.preparing_round } style={{ color: C.accent }}>
          { t("vom.result") }
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, color: C.base }}>{ headline }</h2>
        {
          !isProtagonist &&
          <p style={{ color: C.muted, fontSize: 16, marginTop: 5 }}>{ t("vom.aboutPlayer", { username: protagonistName }) }</p>
        }
      </div>
      <div className="flex flex-col gap-3">
        {
          statements.map((s) => {
            const voterCount = votes.filter((v) => v.statementId === s.id).length;
            return (
              <div
                key={ s.id }
                className={ styles.statement_row }
                style={{ background: s.isLie ? "#FFF8EE" : "#fff", border: `2px solid ${ s.isLie ? C.accent : "#E4EAEA" }` }}
              >
                <span className={ styles.tag } style={{ background: s.isLie ? C.accent : "#EAF3DD", color: s.isLie ? C.base : "#4C7A16" }}>
                  { s.isLie ? t("vom.theLie") : t("vom.truth") }
                </span>
                <span className={ styles.statement_text } style={{ color: C.base }}>{ s.text }</span>
                <span className={ styles.voters } style={{ color: C.faint }}>
                  { voterCount }{" "}{ voterCount === 1 ? t("vom.vote") : t("vom.votes") }
                </span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};