import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Dot, Footer, Logo, TopMenu } from "../components";
import { C } from "../lib";
import styles from "./HelpCenterPage.module.css";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  label: string;
  items: FaqItem[];
}

export const HelpCenterPage = () => {
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ activeCategory, setActiveCategory ] = useState("start");
  const [ openItem, setOpenItem ] = useState<string | null>(null);

  const categories: FaqCategory[] = [
    {
      id: "start",
      label: t("help.cat_start"),
      items: [
        { q: t("help.q1"), a: t("help.a1") },
        { q: t("help.q2"), a: t("help.a2") },
        { q: t("help.q3"), a: t("help.a3") },
        { q: t("help.q4"), a: t("help.a4") },
      ],
    },
    {
      id: "rooms",
      label: t("help.cat_rooms"),
      items: [
        { q: t("help.q5"), a: t("help.a5") },
        { q: t("help.q6"), a: t("help.a6") },
        { q: t("help.q7"), a: t("help.a7") },
        { q: t("help.q8"), a: t("help.a8") },
      ],
    },
    {
      id: "decks",
      label: t("help.cat_decks"),
      items: [
        { q: t("help.q9"), a: t("help.a9") },
        { q: t("help.q10"), a: t("help.a10") },
        { q: t("help.q11"), a: t("help.a11") },
      ],
    },
    {
      id: "account",
      label: t("help.cat_account"),
      items: [
        { q: t("help.q12"), a: t("help.a12") },
        { q: t("help.q13"), a: t("help.a13") },
        { q: t("help.q14"), a: t("help.a14") },
      ],
    },
    {
      id: "price",
      label: t("help.cat_price"),
      items: [
        { q: t("help.q15"), a: t("help.a15") },
      ],
    },
  ];

  const activeItems = categories.find((c) => c.id === activeCategory)?.items ?? [];

  const toggleItem = (q: string) => setOpenItem(openItem === q ? null : q);

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <TopMenu />
        </div>
      </nav>
      <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 items-start">
        {/* ── SIDEBAR ── */}
          <div>
            <div className="player_pick_answer" style={{ color: C.faint }}>{ t("help.categories") }</div>
            <div className={ styles.sidebar_container }>
              {
                categories.map((cat) => (
                  <button
                    key={ cat.id }
                    onClick={ () => { setActiveCategory(cat.id); setOpenItem(null); } }
                    className={ styles.sidebar_btn }
                    style={{
                      fontWeight: activeCategory === cat.id ? 700 : 500,
                      background: activeCategory === cat.id ? `color-mix(in srgb, ${C.accent} 12%, #fff)` : "transparent",
                      color: activeCategory === cat.id ? C.base : C.muted
                    }}
                  >
                    { activeCategory === cat.id && <Dot /> }
                    { cat.label} </button>
                ))
              }
            </div>
            {/* CONTACT CTA */}
            <div className={ styles.sidebar_contact } style={{ background: C.base }}>
              <div className={ styles.sidebar_contact_title }>{ t("help.ctaTitle") }</div>
              <p className={ styles.sidebar_contact_p }>{ t("contact.sentDesc") }</p>
              <Button
                size="sm"
                bgColor={ C.accent }
                textColor={ C.base }
                onClick={ () => navigate("/contact") }
                style={{ width: "100%" }}
              >
                { t("help.ctaBtn") }
              </Button>
            </div>
          </div>
          {/* ── CONTENT ── */}
          <div>
            <h2 className="heading_1" style={{ fontSize: 28, color: C.base, margin: "0 0 25px" }}>
              { categories.find((c) => c.id === activeCategory)?.label }
            </h2>
            <div className={ styles.help_container }>
              {
                activeItems.map(({ q, a }) => {
                  const isOpen = openItem === q;
                  return (
                    <div
                      key={ q }
                      className={ styles.toggle }
                      style={{
                        border: `1.5px solid ${ isOpen ? C.accent : C.borderMid }`,
                        boxShadow: isOpen ? `0 10px 15px -14px color-mix(in srgb, ${C.accent} 60%, transparent)` : "none"
                      }}
                    >
                      <button
                        onClick={ () => toggleItem(q) }
                        className={ styles.toggle_btn }
                      >
                        <span className={ styles.toggle_question } style={{ color: C.base }}>{ q }</span>
                        <span 
                          className={ styles.toggle_icon } 
                          style={{ 
                            background: isOpen ? C.accent : C.surface,
                            border: `1.5px solid ${ isOpen ? C.accent : C.border }`,
                            color: isOpen ? C.base : C.muted,
                          }}
                        >
                          { isOpen ? "−" : "+" }
                        </span>
                      </button>
                      {
                        isOpen && a &&
                        <div className={ styles.toggle_answer } style={{ color: C.muted }}>{ a }</div>
                      }
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};