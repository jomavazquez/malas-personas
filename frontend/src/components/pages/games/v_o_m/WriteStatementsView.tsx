import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../components";
import { api, C } from "../../../../lib";
import type { VomPrompt } from "../../../../types";
import styles from "./v_o_m.module.css";

interface Props {
  onSubmit: (statements: { text: string; isLie: boolean }[]) => void;
}

export const WriteStatementsView = ({ onSubmit }: Props) => {

  const { t, i18n } = useTranslation();
  const [ values, setValues ] = useState(["", "", ""]);
  const [ lieIndex, setLieIndex ] = useState(-1);
  const [ loadingPrompt, setLoadingPrompt ] = useState(false);

  const ready = values.every((v) => v.trim().length > 0) && lieIndex >= 0;

  const handleChange = ( i: number ) => ( e: React.ChangeEvent<HTMLInputElement> ) => {
    setValues((prev) => { const next = [ ...prev ]; next[i] = e.target.value; return next; });
  };

  const handleClear = ( i: number ) => ( e: React.MouseEvent ) => {
    e.stopPropagation();
    setValues((prev) => { const next = [ ...prev ]; next[i] = ""; return next; });
  };

  const handleFillFromPrompt = async () => {
    const blanks = values.map((_, i) => i).filter((i) => !values[i].trim());
    if( blanks.length === 0 ) return;

    setLoadingPrompt(true);
    try{
      const lang = i18n.language.startsWith("es") ? "ES" : "EN";
      const data = await api.get<{ prompt: VomPrompt | null }>(`/vom-prompts/random?language=${lang}`);
      if( !data.prompt ) return;

      const truths = [ data.prompt.truthOne, data.prompt.truthTwo ].sort(() => Math.random() - 0.5);
      const lieSlot = lieIndex >= 0 ? lieIndex : blanks[Math.floor(Math.random() * blanks.length)];

      const next = [ ...values ];
      let truthIndex = 0;
      blanks.forEach((i) => { next[i] = i === lieSlot ? data.prompt!.lie : truths[truthIndex++]; });
      setValues(next);
      if( lieIndex === -1 ) setLieIndex(lieSlot);
    }finally{
      setLoadingPrompt(false);
    }
  };

  const handleSubmit = () => {
    if( !ready ) return;
    onSubmit(values.map((text, i) => ({ text: text.trim(), isLie: i === lieIndex })));
  };

  return (
    <div className={ styles.card }>
      <div className={ styles.title } style={{ color: C.base }}>{ t("vom.writeTitle") }</div>
      <p className={ styles.sub } style={{ color: C.muted }}>{ t("vom.writeSub") }</p>
      <div className="flex flex-col gap-3.5 mb-6">
        {
          values.map((value, i) => {
            const isLie = lieIndex === i;
            return (
              <div
                key={ i }
                className={ styles.write_row }
                onClick={ () => setLieIndex(i) }
                style={{ border: `2px solid ${ isLie ? C.accent : "#E4EAEA" }`, cursor: "pointer" }}
              >
                <input
                  className={ styles.write_input }
                  placeholder={ t("vom.statementPlaceholder", { n: i + 1 }) }
                  value={ value }
                  onChange={ handleChange(i) }
                  onClick={ ( e ) => e.stopPropagation() }
                  maxLength={ 140 }
                  style={{ color: C.base }}
                />
                {
                  value.length > 0 &&
                  <button
                    type="button"
                    className={ styles.clear_btn }
                    onClick={ handleClear(i) }
                    aria-label={ t("vom.clearField") }
                  >
                    ✕
                  </button>
                }
                <button
                  className={ styles.lie_btn }
                  onClick={ ( e ) => { e.stopPropagation(); setLieIndex(i); } }
                  style={{ background: isLie ? C.accent : "#F1F5F5", color: isLie ? C.base : "#8A9199" }}
                >
                  { isLie ? t("vom.theLie") : t("vom.markAsLie") }
                </button>
              </div>
            );
          })
        }
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={ handleSubmit } disabled={ !ready } bgColor={ C.accent } textColor="#000">
          { t("vom.sendStatements") }{" "}→
        </Button>
        <Button variant="outline" onClick={ handleFillFromPrompt } disabled={ loadingPrompt }>
          { t("vom.useExample") }
        </Button>
        {
          !ready &&
          <span className="anim" style={{ fontSize: 14, color: C.faint }}>{ t("vom.writeHint") }</span>
        }
      </div>
    </div>
  );
};