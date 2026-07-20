import { useTranslation } from "react-i18next";
import { BlackCard, PlayedCardTile } from "../../../components";
import { C } from "../../../lib";
import type { Card, PlayedCard } from "../../../types";
import styles from "./Game.module.css";

interface RoundResult {
  winner: { userId: string; username: string; score: number };
  winningCard: Card;
}

interface Props {
  blackCard: Card | null;
  revealedCards: PlayedCard[] | null;
  roundResult: RoundResult | null;
  showingResult: boolean;
  winnerCardId: string | null;
  selectedWinner: string | null;
  playedCount: number;
  totalNeeded: number;
  playedCards: { id: string; text: string }[];
  onPickWinner: (userId: string) => void;
}

export const JudgeView = ({ blackCard, revealedCards, roundResult, showingResult, winnerCardId, selectedWinner, playedCount, totalNeeded, playedCards, onPickWinner }: Props) => {

  const { t } = useTranslation();

  return (
    <div>
      { 
        blackCard && 
        <BlackCard question={ blackCard.text } />
      }
      {
        revealedCards && (!roundResult || showingResult)
        ?
          <div>
            <p className={ `my-5 ${ styles.judge_desc } ${ styles.anim }` } style={{ color: C.accent }}>
              { roundResult ? `🏆 ${roundResult.winner.username}` : `${ t("game.pickWinner") } · ${ revealedCards.length } ${ revealedCards.length === 1 ? t("mydecks.white").toLowerCase() : t("game.answers") }` }
            </p>
            <div className={ `mb-10 ${ styles.judge_grid }` }>
              {
                revealedCards.map(({ userId, card }) => (
                  <PlayedCardTile
                    key={ userId }
                    text={ card.text }
                    badge={ winnerCardId === card.id ? "winner" : undefined }
                    highlighted={ selectedWinner === userId }
                    clickable={ !roundResult }
                    onClick={ () => onPickWinner(userId) }
                  />
                ))
              }
            </div>
          </div>
        : !roundResult
          ?
            <>
              <p className={ `my-5 ${ styles.judge_desc } ${ styles.anim }` } style={{ color: C.accent }}>{ t("game.waitingForPlayers") }{" "}({ playedCount } / { totalNeeded })</p>
              {
                playedCards.length > 0 &&
                <div className={ `mb-10 ${ styles.judge_grid }` }>
                  {
                    playedCards.map((card) => (
                      <PlayedCardTile key={ card.id } text={ card.text } />
                    ))
                  }
                </div>
              }
            </>
          : null
      }
    </div>
  );
};