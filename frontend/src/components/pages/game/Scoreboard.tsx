import { useTranslation } from "react-i18next";
import { Avatar } from "../../../components";
import { C } from "../../../lib";
import type { Player } from "../../../types";
import styles from "./Game.module.css";

interface Props {
  players: Player[];
  judgeId?: string;
  myId: string;
  pointsToWin: number;
  playedCount: number;
  showCardsOnTable: boolean;
}

export const Scoreboard = ({ players, judgeId, myId, pointsToWin, playedCount, showCardsOnTable }: Props) => {

  const { t } = useTranslation();

  return (
    <div className="pb-10">
      <div className="flex">
        <div className="player_pick_answer" style={{ color: C.faint }}>
          { t("game.score") }
          {
            showCardsOnTable &&
            <span style={{ color: C.faint, fontWeight: 500 }}>{" "}·{" "}{ playedCount }{" "}{ t("game.cardsOnTable") }</span>
          }
        </div>
        <div className="player_pick_answer" style={{ marginLeft: "auto", color: C.faint, alignSelf: "center" }}>
          { t("game.goal") }{" "}·{" "}<strong>{ pointsToWin }</strong>{" "}{ t("myroom.points") }
        </div>
      </div>
      <div className={ styles.score_grid }>
        {
          players.map((p) => {
            const isMe = p.userId === myId;
            const isJ = p.userId === judgeId;
            return (
              <div
                key={ p.userId }
                className={ styles.score_player }
                style={{
                  background: isMe ? `color-mix(in srgb, ${C.accent} 15%, #fff)` : "#fff",
                  border: `1.5px solid ${ isMe ? C.accent : C.border }`,
                }}
              >
                <Avatar size={ 28 } user={ p.username } showLabel />
                {
                  isJ &&
                  <span className={ styles.score_judge_label }>{ t("game.judgeLabel").toUpperCase() }</span>
                }
                {
                  p.isSpectator &&
                  <span className={ styles.spectator_label } style={{ color: C.faint }}>{ t("game.spectatorLabel").toUpperCase() }</span>
                }
                <span className={ styles.score } style={{ color: C.base }}>{ p.score }</span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};