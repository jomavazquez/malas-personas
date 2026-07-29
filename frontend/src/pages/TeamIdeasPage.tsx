import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { Badge, Button, Footer, TopMenu } from "../components";
import { C } from "../lib";
import type { GameType } from "../types";
import styles from "./TeamIdeasPage.module.css";

interface Idea {
  id: string;
  gameType: GameType;
  time: number;
}

const ideas: Idea[] = [
  { id: "item1", gameType: "V_O_M",           time: 15 },
  { id: "item2", gameType: "MALAS_PERSONAS",  time: 10 },
  { id: "item3", gameType: "V_O_M",           time: 20 },
  { id: "item4", gameType: "V_O_M",           time: 25 },
  { id: "item5", gameType: "MALAS_PERSONAS",  time: 30 },
  { id: "item6", gameType: "MALAS_PERSONAS",  time: 10 },
  { id: "item7", gameType: "V_O_M",           time: 15 },
];

export const TeamIdeasPage = () => {

  const { t } = useTranslation(["translation", "ideas"]);
  const { user } = useAuth();
  const [ filter, setFilter ] = useState<"ALL" | GameType>("ALL");

  const filteredIdeas = ideas.filter((idea) => filter === "ALL" || idea.gameType === filter);

  const filters: { value: "ALL" | GameType; label: string }[] = [
    { value: "ALL", label: t("ideas:filterAll") },
    { value: "MALAS_PERSONAS", label: t("lobby.gameMP") },
    { value: "V_O_M", label: t("lobby.gameVOM") },
  ];

  return (
    <div style={{ background: "#fff", position: "relative" }}>
      <TopMenu />
      <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10 items-start">
          {/* ── SIDEBAR ── */}
          <div>
            <div className={ styles.eyebrow } style={{ color: C.accentDeep }}>{ t("ideas:eyebrow") }</div>
            <h2 className="heading_1" style={{ fontSize: 32, color: C.base, margin: "0 0 15px" }}>
              { t("ideas:title") }
            </h2>
            <p className={ styles.desc } style={{ color: C.muted }}>{ t("ideas:desc") }</p>
            <div className="right_chips_container" style={{ marginBottom: 25 }}>
              {
                filters.map((f) => (
                  <button
                    key={ f.value }
                    onClick={ () => setFilter(f.value) }
                    className="right_chips"
                    style={{
                      border: "none",
                      background: filter === f.value ? C.base : "#fff",
                      color: filter === f.value ? "#fff" : C.muted,
                      boxShadow: filter === f.value ? "none" : `inset 0 0 0 1.5px ${C.border}`,
                    }}
                  >
                    { f.label }
                  </button>
                ))
              }
            </div>
            <Button
              to={ user ? "/lobby" : "/register" }
              state={ user && filter !== "ALL" ? { gameType: filter } : undefined }
              bgColor={ C.accent }
              textColor={ C.base }
            >
              { t("ideas:cta") } →
            </Button>
          </div>
          {/* ── LIST ── */}
          <div className={ styles.list }>
            {
              filteredIdeas.map((idea) => (
                <div key={ idea.id } className={ styles.row } style={{ borderColor: C.borderMid }}>
                  <div className={ styles.row_main }>
                    <div className={ styles.row_title } style={{ color: C.base }}>{ t(`ideas:${idea.id}_title`) }</div>
                    <div className={ styles.row_desc } style={{ color: C.muted }}>{ t(`ideas:${idea.id}_desc`) }</div>
                  </div>
                  <div className={ styles.row_meta }>
                    <Badge dot={ false } marginBottom={ 8 } color={ idea.gameType === "V_O_M" ? "#3C6FB0" : C.faint }>
                      { t(idea.gameType === "MALAS_PERSONAS" ? "lobby.gameMP" : "lobby.gameVOM") }
                    </Badge>
                    <div className={ styles.row_time } style={{ color: C.faint }}>{ idea.time } { t("ideas:min") }</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};