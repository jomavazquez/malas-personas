import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { C } from "../../../lib";
import type { Card } from "../../../types";
import styles from "./Game.module.css";

interface Props {
  hand: Card[];
  selectedCard: string | null;
  hasPlayed: boolean;
  onPlayCard: (cardId: string) => void;
  onSendCard: () => void;
}

export const PlayerHand = ({ hand, selectedCard, hasPlayed, onPlayCard, onSendCard }: Props) => {

  const { t } = useTranslation();

  return (
    <div>
      <div className="player_pick_answer" style={{ color: C.faint }}>{ t("game.pickCard") }</div>
      <div className={ styles.player_card_container }>
        {
          hand.map((card) => {
            const isSelected = selectedCard === card.id;
            return (
              <div
                key={ card.id }
                onClick={ () => !hasPlayed && onPlayCard(card.id) }
                className={ styles.player_card }
                style={{
                  border: `1.5px solid ${ isSelected ? C.accent : C.border }`,
                  cursor: hasPlayed ? "default" : "pointer",
                  opacity: hasPlayed && !isSelected ? 0.5 : 1,
                  boxShadow: isSelected ? `0 4px 16px -6px color-mix(in srgb, ${ C.accent } 40%, transparent)` : "none"
                }}
              >
                <span className={ styles.player_card_title } style={{ color: C.base }}>{ card.text }</span>
                {
                  isSelected &&
                  <span className={ styles.player_card_check } style={{ background: C.accent, color: C.base }}>✓</span>
                }
              </div>
            );
          })
        }
      </div>
      {
        !hasPlayed &&
        <Button
          bgColor={ selectedCard ? C.accent : "#ccc" }
          textColor={ C.base }
          onClick={ onSendCard }
          disabled={ !selectedCard }
          style={{
            boxShadow: selectedCard ? `0 10px 25px -10px color-mix(in srgb, ${C.accent} 50%, transparent)` : "none",
            marginBottom: 50,
            marginTop: -25,
            width: "100%"
          }}
        >
          { t("game.sendCard") }
        </Button>
      }
    </div>
  );
};