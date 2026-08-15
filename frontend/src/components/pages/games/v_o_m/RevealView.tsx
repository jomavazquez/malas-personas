import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../../../components";
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
  nextRoundAt: number;
  gameOver: boolean;
}

export const RevealView = ({ statements, votes, fooledCount, protagonistUserId, protagonistName, myId, nextRoundAt, gameOver }: Props) => {

  const { t } = useTranslation();
  const [ now, setNow ] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [ nextRoundAt ]);

  const secondsLeft = Math.max(0, Math.ceil((nextRoundAt - now) / 1000));
  const isProtagonist = myId === protagonistUserId;
  const lieStatement = statements.find((s) => s.isLie);
  const myVote = votes.find((v) => v.userId === myId);
  const gotIt = myVote && lieStatement && myVote.statementId === lieStatement.id;

  const headline = isProtagonist
    ? `${ t("vom.youFooled", { count: fooledCount }) }. ${ fooledCount === 1 ? t("vom.youWonPoint", { count: fooledCount }) : t("vom.youWonPoints", { count: fooledCount }) }`
    : gotIt
      ? `${ t("vom.youCaughtTheLie") } (${ t("vom.wonOnePoint") })`
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
            const statementVoters = votes.filter((v) => v.statementId === s.id);
            return (
              <div
                key={ s.id }
                className={ styles.statement_row }
                style={{
                  background: s.isLie ? "#FFF8EE" : "#fff",
                  border: `2px solid ${ s.isLie ? C.accent : "#E4EAEA" }`,
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className={ styles.tag } style={{ background: s.isLie ? C.accent : "#EAF3DD", color: s.isLie ? C.base : "#4C7A16" }}>
                    { s.isLie ? t("vom.theLie") : t("vom.truth") }
                  </span>
                  <span className={ styles.statement_text } style={{ color: C.base }}>{ s.text }</span>
                  <span className={ styles.voters } style={{ color: C.faint }}>
                    { statementVoters.length }{" "}{ statementVoters.length === 1 ? t("vom.vote") : t("vom.votes") }
                  </span>
                </div>
                {
                  statementVoters.length > 0 &&
                  <div className={ styles.voter_list }>
                    {
                      statementVoters.map((v) => {
                        const isMe = v.userId === myId;
                        return (
                          <div key={ v.userId } className={ styles.voter_chip } style={{ color: isMe ? C.accent : C.base }}>
                            <Avatar user={ v.username } bgColor={ isMe ? C.accent : "#EAF0F0" } textColor={ isMe ? C.base : C.muted } />
                            <span style={ isMe ? { color: C.accent, fontWeight: 700 } : undefined }>
                              { isMe ? t("room.you") : v.username }
                            </span>
                          </div>
                        );
                      })
                    }
                  </div>
                }
              </div>
            );
          })
        }
      </div>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <span className={ styles.preparing_round } style={{ color: C.accent }}>
          { t(gameOver ? "vom.gameEndingIn" : "vom.nextRoundIn", { seconds: secondsLeft }) }
        </span>
      </div>
    </div>
  );
};