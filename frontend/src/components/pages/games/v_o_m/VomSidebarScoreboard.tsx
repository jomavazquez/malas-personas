import { useTranslation } from "react-i18next";
import { Avatar } from "../../../../components";
import { C } from "../../../../lib";
import type { VomPlayer, VomPlayerStatus } from "../../../../types";
import styles from "./v_o_m.module.css";

interface Props {
  players: VomPlayer[];
  protagonistUserId: string | null;
  myId: string;
  pointsToWin: number;
}

const STATUS_LABEL_KEY: Record<VomPlayerStatus, string> = {
  idle: "vom.statusIdle",
  writing: "vom.statusWriting",
  awaiting_statements: "vom.statusAwaiting",
  focus: "vom.statusFocus",
  thinking: "vom.statusThinking",
  voted: "vom.statusVoted",
  spectator: "vom.statusSpectator",
};

export const VomSidebarScoreboard = ({ players, protagonistUserId, myId, pointsToWin }: Props) => {

  const { t } = useTranslation();
  const sorted = [ ...players ].sort((a, b) => b.score - a.score);

  return (
    <div className={ styles.sidebar }>
      {/* PLAYER STATUSES */}
      <div className={ styles.sidebar_box } style={{ background: C.base }}>
        <div className="player_pick_answer" style={{ color: "#9AA3AB" }}>{ t("vom.atTheTable") }</div>
        {
          players.map((p) => {
            const isProtagonist = p.userId === protagonistUserId;
            return (
              <div key={ p.userId } className={ styles.sidebar_row }>
                <div className={ styles.sidebar_name } style={{ color: "#fff" }}>
                  <Avatar user={ p.username } bgColor={ p.userId === myId ? C.accent : "#3C3D46" } textColor="#fff" />
                  { p.username }
                </div>
                <span
                  className={ styles.status_pill }
                  style={{
                    background: isProtagonist ? C.accent : "rgba(255,255,255,.1)",
                    color: isProtagonist ? C.base : "#C7CCD1",
                  }}
                >
                  { t(STATUS_LABEL_KEY[p.status]).toUpperCase() }
                </span>
              </div>
            );
          })
        }
      </div>
      {/* SCOREBOARD */}
      <div className={ styles.sidebar_box } style={{ background: "#fff" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>{ t("game.score") }</span>
          <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>{ t("game.goal") }{" "}·{" "}{ pointsToWin }</span>
        </div>
        {
          sorted.map((p) => (
            <div key={ p.userId } className={ styles.board_row }>
              <div className={ styles.sidebar_name } style={{ color: C.base }}>
                <Avatar user={ p.username } />
                { p.username }
              </div>
              <span data-testid={ `vom-score-${ p.userId }` } className={ styles.board_score } style={{ color: C.base }}>{ p.score }</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};