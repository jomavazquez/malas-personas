import { useTranslation } from "react-i18next";
import { Logo } from "../../../components";
import { C } from "../../../lib";
import styles from "./Game.module.css";

interface Props {
  isJudge: boolean;
  judgeUsername?: string;
  playerCount: number;
  timer: number;
  clock: number;
}

export const GameNav = ({ isJudge, judgeUsername, playerCount, timer, clock }: Props) => {

  const { t } = useTranslation();

  return (
    <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
      <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          {
            isJudge
            ? <span className={ styles.you_judge } style={{ background: C.accent, color: C.base }}>{ t("game.youAreJudge") }</span>
            : <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>
                { t("room.judge") }:{" "}<strong style={{ color: C.faint }}>{ judgeUsername }</strong>
              </span>
          }
          <span className={ styles.dot } style={{ background: C.accent }} />
          <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>{ playerCount }{" "}{ t("room.players") }</span>
          <span className={ styles.dot } style={{ background: C.accent }} />
          <div className={ styles.clock } style={{ color: timer <= 10 ? "#E5534B" : C.base }}>
            <span className={ styles.clock_dot } style={{ background: timer <= 10 ? "#E5534B" : C.accent }} />
            { String(Math.floor(timer / clock)).padStart(1, "0") }:{ String(timer % clock).padStart(2, "0") }
          </div>
        </div>
      </div>
    </nav>
  );
};