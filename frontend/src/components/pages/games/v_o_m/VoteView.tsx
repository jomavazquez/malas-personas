import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../components";
import { C } from "../../../../lib";
import type { VomStatement } from "../../../../types";
import styles from "./v_o_m.module.css";

interface Props {
  statements: VomStatement[];
  myVote: string | null;
  protagonistName: string;
  onVote: ( statementId: string ) => void;
}

export const VoteView = ({ statements, myVote, protagonistName, onVote }: Props) => {

  const { t } = useTranslation();
  const hasVoted = !!myVote;
  const [ pending, setPending ] = useState<string | null>(null);

  const handleConfirm = () => {
    if( !pending || hasVoted ) return;
    onVote(pending);
  };

  return (
    <div className={ styles.card }>
      <div className={ styles.title } style={{ color: C.base }}>{ t("vom.voteTitle") }</div>
      <p className={ styles.sub } style={{ color: C.muted }}>{ t("vom.voteSub", { username: protagonistName }) }</p>
      <div className="flex flex-col gap-3 mb-6">
        {
          statements.map((s) => {
            const selected = ( myVote ?? pending ) === s.id;
            return (
              <div
                key={ s.id }
                onClick={ () => !hasVoted && setPending(s.id) }
                className={ styles.statement_row }
                style={{
                  background: selected ? "#FFF8EE" : "#fff",
                  border: `2px solid ${ selected ? C.accent : "#E4EAEA" }`,
                  cursor: hasVoted ? "default" : "pointer",
                  opacity: hasVoted && !selected ? 0.6 : 1,
                }}
              >
                <span
                  className={ styles.statement_dot }
                  style={{ border: `2px solid ${ selected ? C.accent : "#C9D2D2" }`, background: selected ? C.accent : "transparent", color: "#fff" }}
                >
                  { selected ? "✓" : "" }
                </span>
                <span className={ styles.statement_text } style={{ color: C.base }}>{ s.text }</span>
              </div>
            );
          })
        }
      </div>
      {
        hasVoted
        ? <p className="anim" style={{ fontSize: 14, color: C.faint }}>{ t("vom.waitingForOthers") }</p>
        : <Button onClick={ handleConfirm } disabled={ !pending } bgColor={ C.accent } textColor="#000">
            { t("vom.confirmVote") }{" "}→
          </Button>
      }
    </div>
  );
};