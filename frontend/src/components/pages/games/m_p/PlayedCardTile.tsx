import { C } from "../../../../lib";
import styles from "./m_p.module.css";

interface Props {
  text: string;
  badge?: "winner" | "mine";
  highlighted?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  // Only set where no accessible selector exists for e2e (this tile is a plain
  // clickable <div>, not a <button>) — see JudgeView's reveal grid.
  testId?: string;
}

export const PlayedCardTile = ({ text, badge, highlighted = false, clickable = false, onClick, testId }: Props) => {

  const isWinner = badge === "winner";

  return (
    <div
      onClick={ clickable ? onClick : undefined }
      data-testid={ testId }
      className={ styles.judge_cards }
      style={{
        background: isWinner ? C.accent : highlighted ? `color-mix(in srgb, ${C.accent} 12%, #fff)` : "#fff",
        border: `1.5px solid ${ isWinner || highlighted ? C.accent : C.border }`,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <div className={ styles.judge_cards_title } style={{ color: C.base }}>{ text }</div>
      {
        isWinner &&
        <span className={ styles.player_card_check } style={{ background: C.base, color: "#fff" }}>🏆</span>
      }
      {
        badge === "mine" &&
        <span className={ styles.player_card_check } style={{ background: C.accent, color: C.base }}>✓</span>
      }
    </div>
  );
};