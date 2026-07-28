import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "../../../../components";
import { C } from "../../../../lib";
import styles from "../m_p/m_p.module.css";

interface Props {
  roundNumber: number;
  playerCount: number;
  voteDeadlineAt?: number | null;
}

export const VomNav = ({ roundNumber, playerCount, voteDeadlineAt }: Props) => {

  const { t } = useTranslation();
  const [ now, setNow ] = useState(() => Date.now());

  useEffect(() => {
    if( !voteDeadlineAt ) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [ voteDeadlineAt ]);

  const remaining = voteDeadlineAt ? Math.max(0, Math.round((voteDeadlineAt - now) / 1000)) : null;

  return (
    <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
      <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>
            { t("vom.roundLabel", { round: roundNumber }) }
          </span>
          <span className={ styles.dot } style={{ background: C.accent }} />
          <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>{ playerCount }{" "}{ t("room.players") }</span>
          {
            remaining !== null &&
            <>
              <span className={ styles.dot } style={{ background: C.accent }} />
              <div className={ styles.clock } style={{ color: remaining <= 10 ? "#E5534B" : C.base }}>
                <span className={ styles.clock_dot } style={{ background: remaining <= 10 ? "#E5534B" : C.accent }} />
                { String(Math.floor(remaining / 60)).padStart(1, "0") }:{ String(remaining % 60).padStart(2, "0") }
              </div>
            </>
          }
        </div>
      </div>
    </nav>
  );
};