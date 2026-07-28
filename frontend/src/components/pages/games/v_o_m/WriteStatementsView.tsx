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

  const handleFillFromPrompt = async () => {
    setLoadingPrompt(true);
    try{
      const lang = i18n.language.startsWith("es") ? "ES" : "EN";
      const data = await api.get<{ prompt: VomPrompt | null }>(`/vom-prompts/random?language=${lang}`);
      if( !data.prompt ) return;
      const order = [ data.prompt.truthOne, data.prompt.truthTwo, data.prompt.lie ]
        .map((text, i) => ({ text, isLie: i === 2 }))
        .sort(() => Math.random() - 0.5);
      setValues(order.map((s) => s.text));
      setLieIndex(order.findIndex((s) => s.isLie));
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