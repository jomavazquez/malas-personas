import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Dot, Footer, Logo, TopMenuMyAccount } from "../components";
import { api, C } from "../lib";
import styles from "./MyDecksPage.module.css";

interface Deck {
  id: string;
  name: string;
  language: "ES" | "EN";
  _count: { cards: number };
}

const CARD_COLORS = [ C.base, C.accent ];

export const MyDecksPage = () => {
  
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [ decks, setDecks ] = useState<Deck[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ search, setSearch ] = useState("");
  const [ showNewModal, setShowNewModal ] = useState(false);
  const [ deleteId, setDeleteId ] = useState<string | null>(null);
  const [ newForm, setNewForm ] = useState({ name: "", language: "ES" as "ES" | "EN" });
  const [ creating, setCreating ] = useState(false);
  const [ createError, setCreateError ] = useState("");

  useEffect(() => {
    api.get<{ decks: Deck[] }>("/decks/my/decks").then((data) => {
      setDecks(data.decks);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = decks.filter( (d) => !search.trim() || d.name.toLowerCase().includes(search.toLowerCase()) );

  const handleCreate = async () => {
    if( !newForm.name.trim() ) return;

    // Check if name already exists
    const exists = decks.some((d) => d.name.toLowerCase() === newForm.name.trim().toLowerCase());
    if( exists ){
      setCreateError( t("mydecks.nameExists") );
      return;
    }
    setCreateError("");
    setCreating(true);
    try{
      const data = await api.post<{ deck: Deck }>("/decks/my/decks", newForm);
      setDecks((prev) => [data.deck, ...prev]);
      setShowNewModal(false);
      setNewForm({ name: "", language: "ES" });
    }catch{
      setCreateError( t("mydecks.createError") );
    }finally{
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/decks/my/decks/${deleteId}`);
      setDecks((prev) => prev.filter((d) => d.id !== deleteId));
    } catch {
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      {/* DELETE MODAL */}
      {
        deleteId &&
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={ () => setDeleteId(null) }>
          <div className="modal_container" onClick={ (e) => e.stopPropagation() }>
            <div className="modal_title" style={{ color: C.base }}>{ t("mydecks.deleteTitle") }</div>
            <p className="modal_body" style={{ color: C.muted }}>{ t("mydecks.deleteConfirm") }</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn_cancel"
                onClick={ () => setDeleteId(null) }
                style={{ border: `1.5px solid ${C.border}`, color: C.base }}
              >
                { t("myroom.cancel") }
              </button>
              <button
                className="btn btn_delete"
                onClick={handleDelete}
              >
                { t("myroom.delete") }
              </button>
            </div>
          </div>
        </div>
      }
      {/* NEW DECK MODAL */}
      {
        showNewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={ () => setShowNewModal(false) }>
          <div className="modal_container" onClick={ (e) => e.stopPropagation() }>
            <div className="modal_title" style={{ color: C.base }}>{ t("mydecks.newDeck") }</div>
            <div style={{ marginBottom: 20 }}>
              <label className="form_label" style={{ color: C.muted }}>{ t("mydecks.deckName") }</label>
              <input
                className="input"
                style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                placeholder={ t("mydecks.deckNamePlaceholder") }
                value={ newForm.name }
                onChange={(e) => { setNewForm((f) => ({ ...f, name: e.target.value })); setCreateError(""); }}
                maxLength={ 60 }
                autoFocus
                onKeyDown={ (e) => e.key === "Enter" && handleCreate() }
              />
              {
                createError && 
                <p className="error" style={{ marginTop: 5 }}>{ createError }</p>
              }
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form_label" style={{ color: C.muted }}>{ t("lobby.gameLang") }</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {
                  (["ES", "EN"] as const).map((lang) => (
                    <button
                      key={ lang }
                      onClick={() => setNewForm((f) => ({ ...f, language: lang }))}
                      className="langBt"
                      style={{
                        border: `1.5px solid ${ newForm.language === lang ? C.accent : C.border }`,
                        background: newForm.language === lang ? `color-mix(in srgb, ${ C.accent } 10%, #fff)` : "#fff", 
                        color: C.base, 
                      }}
                    >
                      {
                        newForm.language === lang && <Dot />
                      }
                      {
                        lang === "ES" ? "Español" : "English"
                      }
                    </button>
                  ))
                }
              </div>
            </div>
            <Button
              bgColor={ C.accent }
              textColor="#000"
              disabled={ !newForm.name.trim() || creating }
              onClick={ handleCreate }
              style={{ width: "100%"}}
            >
              { creating ? "..." : t("mydecks.create") }
            </Button>
          </div>
        </div>
      )}
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <TopMenuMyAccount />
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="heading_1" style={{ color: C.base }}>{ t("mydecks.title") }</h1>
            <p style={{ fontSize: 16, color: C.muted }}>{ decks.length }{" "}{ t(decks.length === 1 ? "mydecks.1deck" : "mydecks.decks") }</p>
          </div>
          <div className={ styles.filter_search }>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span className="search_icon" style={{ color: C.faint }}>⌕</span>
              <input
                className="input search"
                style={{ border: `1.5px solid ${C.border}`, color: C.base, paddingTop: 10, paddingBottom: 10 }}
                placeholder={ t("mydecks.search") }
                value={ search }
                onChange={ (e) => setSearch(e.target.value) }
              />
            </div>
            <Button 
              onClick={ () => setShowNewModal(true) } 
              bgColor={ C.accent } 
              textColor="#000"
              size="sm"
            >
              +{" "}{ t("mydecks.newDeck") }
            </Button>
          </div>
        </div>
        {/* GRID */}
        {
          loading 
          ? <p className={ styles.loading } style={{ color: C.base }}>{ t("myroom.loading") }</p>
          : 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
              filtered.map((deck, i) => {
                const bg = CARD_COLORS[i % CARD_COLORS.length];
                return (
                  <div 
                    key={ deck.id } 
                    className={ styles.maze }  
                    style={{ border: `1.5px solid ${ C.borderMid }` }}
                  >
                    <div className={ styles.card_preview } style={{ background: bg }}>
                      <span className={ styles.lang }>{ deck.language }</span>
                      <div className={ styles.mini_card }>
                        <span className={ styles.mini_card_txt } style={{ color: C.base }}>{ deck.name.slice(0, 30) }...</span>
                      </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <div className={ styles.card_title } style={{ color: C.base }}>{ deck.name }</div>
                      <div className={ styles.card_number } style={{ color: C.faint }}>{ deck._count.cards }{" "}{ t(deck._count.cards > 1 ? "mydecks.cards" : "mydecks.card") }</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Button
                          onClick={() => navigate("/my-cards", { state: { deck } })}
                          size="sm"
                          style={{ flex: 1 }}
                        >
                          { t("mydecks.manage") }
                        </Button>
                      <button
                        onClick={ () => setDeleteId(deck.id) }
                        className="btn_red"
                        style={{ borderRadius: 12, fontSize: 14, height: "auto" }}
                        title={ t("myroom.delete") }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
              {/* NEW DECK */}
              <button
                onClick={ () => setShowNewModal(true) }
                className={ styles.new_deck }
                style={{ border: `2px dashed ${ C.border }` }}
              >
                <div className={ styles.new_deck_icon} style={{ background: C.accent, color: C.base }}>+</div>
                <div>
                  <div className={ styles.card_title } style={{ color: C.base }}>{ t("mydecks.newDeck") }</div>
                  <div className={ styles.new_deck_sub } style={{ color: C.faint }}>{ t("mydecks.newDeckSub") }</div>
                </div>
              </button>
            </div>
        }
      </div>
      <Footer />
    </div>
  );
};