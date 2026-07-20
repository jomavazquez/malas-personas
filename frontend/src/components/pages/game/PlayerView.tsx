import { useTranslation } from "react-i18next";
import { BlackCard, PlayedCardTile, PlayerHand } from "../../../components";
import { C } from "../../../lib";
import type { Card, PlayedCard } from "../../../types";
import styles from "./Game.module.css";

interface RoundResult {
  winner: { userId: string; username: string; score: number };
  winningCard: Card;
}

interface Props {
  blackCard: Card | null;
  playedCount: number;
  totalNeeded: number;
  roundResult: RoundResult | null;
  showingResult: boolean;
  revealedCards: PlayedCard[] | null;
  hasPlayed: boolean;
  playedCards: { id: string; text: string }[];
  winnerCardId: string | null;
  myId: string;
  selectedCard: string | null;
  hand: Card[];
  onPlayCard: (cardId: string) => void;
  onSendCard: () => void;
}

export const PlayerView = ({ blackCard, playedCount, totalNeeded, roundResult, showingResult, revealedCards, hasPlayed, playedCards, winnerCardId, myId, selectedCard, hand, onPlayCard, onSendCard }: Props) => {

  const { t } = useTranslation();
  const cardsToShow = revealedCards ?? playedCards.map((c) => ({ userId: "", username: "", card: c }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
      {/* LEFT: BLACK CARD */}
      <div>
        { 
          blackCard && 
          <BlackCard question={ blackCard.text } />
        }
        {
          playedCount > 0 && (!roundResult || showingResult) &&
          <p className={ `my-5 ${ styles.judge_desc } ${ styles.anim }` } style={{ color: C.accent }}>
            { roundResult ? `🏆 ${roundResult.winner.username}` : revealedCards ? t("game.waitingForJudge") : t("game.played", { count: playedCount, total: totalNeeded }) }
          </p>
        }
        {
          hasPlayed && playedCards.length > 0 && (!roundResult || showingResult) &&
          <div className={ `mb-10 ${ styles.judge_grid }` }>
            {
              cardsToShow.map(({ userId, card }, i) => {
                const isMyCard = revealedCards ? userId === myId : i === playedCards.findIndex((c) => c.id === selectedCard);
                const isWinner = winnerCardId === card.id;
                return (
                  <PlayedCardTile
                    key={ card.id }
                    text={ card.text }
                    badge={ isWinner ? "winner" : isMyCard ? "mine" : undefined }
                    highlighted={ isMyCard }
                  />
                );
              })
            }
          </div>
        }
      </div>
      {/* RIGHT: HAND */}
      <PlayerHand 
        hand={ hand } 
        selectedCard={ selectedCard } 
        hasPlayed={ hasPlayed } 
        onPlayCard={ onPlayCard } 
        onSendCard={ onSendCard } 
      />
    </div>
  );
};