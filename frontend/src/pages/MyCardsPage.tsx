import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Footer, Logo, TopMenuMyAccount, UnderlineLink } from "../components";
import { api, BlackCardText, C } from "../lib";
import styles from "./MyCardsPage.module.css";

interface Card {
  id: string;
  type: "BLACK" | "WHITE";
  text: string;
}

interface Deck {
  id: string;
  name: string;
  language: "ES" | "EN";
  _count: { cards: number };
}

type FilterType = "ALL" | "BLACK" | "WHITE";

const PAGE_SIZE = 10;

export const MyCardsPage = () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const deckFromState = location.state?.deck as Deck | undefined;
  const id = deckFromState?.id;

  const [ deck, setDeck ] = useState<Deck | null>(deckFromState ?? null);
  const [ cards, setCards ] = useState<Card[]>([]);
  const [ total, setTotal ] = useState(0);
  const [ pages, setPages ] = useState(1);
  const [ page, setPage ] = useState(1);
  const [ filter, setFilter ] = useState<FilterType>("ALL");
  const [ search, setSearch ] = useState("");
  const [ loading, setLoading ] = useState(true);
  const [ blackCount, setBlackCount ] = useState(0);
  const [ whiteCount, setWhiteCount ] = useState(0);

  // Modal state
  const [ modal, setModal ] = useState<{ mode: "add" | "edit"; card?: Card } | null>(null);
  const [ modalForm, setModalForm ] = useState({ type: "BLACK" as "BLACK" | "WHITE", text: "" });
  const [ saving, setSaving ] = useState(false);
  const [ deleteId, setDeleteId ] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if no deck in state
  useEffect(() => {
    if( !deckFromState ) navigate("/my-decks");
  }, []);

  // Load cards
  useEffect(() => {
    if( !id ) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if( filter !== "ALL" ) params.set("type", filter);
    if( search.trim() ) params.set("search", search.trim());
    api.get<{ cards: Card[]; total: number; pages: number; blackCount: number; whiteCount: number }>(`/decks/my/decks/${id}/cards?${params}`)
      .then((data) => { setCards(data.cards); setTotal(data.total); setPages(data.pages); setBlackCount(data.blackCount); setWhiteCount(data.whiteCount); })
      .finally(() => setLoading(false));
  }, [ id, page, filter, search ]);

  const openAdd = () => { setModalForm({ type: "BLACK", text: "" }); setModal({ mode: "add" }); };
  const openEdit = (card: Card) => { setModalForm({ type: card.type, text: card.text }); setModal({ mode: "edit", card }); };
  const closeModal = () => { setModal(null); setModalForm({ type: "BLACK", text: "" }); };

  const insertGap = () => {
    const textarea = textareaRef.current;
    if( !textarea ) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = modalForm.text;
    const newText = text.slice(0, start) + "______" + text.slice(end);
    setModalForm((f) => ({ ...f, text: newText }));
    // Restore cursor position after the inserted gap
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 6, start + 6);
    }, 0);
  };

  const handleSave = async () => {
    if( !modalForm.text.trim() || !id ) return;
    setSaving(true);
    try{
      if( modal?.mode === "add" ){
        const data = await api.post<{ card: Card }>(`/decks/my/decks/${id}/cards`, modalForm);
        setCards((prev) => [data.card, ...prev].slice(0, PAGE_SIZE));
        setTotal((t) => t + 1);
        setDeck((d) => d ? { ...d, _count: { cards: d._count.cards + 1 } } : d);
      }else if( modal?.mode === "edit" && modal.card ){
        const data = await api.patch<{ card: Card }>(`/decks/my/decks/${id}/cards/${modal.card.id}`, { text: modalForm.text });
        setCards((prev) => prev.map((c) => c.id === data.card.id ? data.card : c));
      }
      closeModal();
    }catch{
    }finally{
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if( !deleteId || !id ) return;
    try{
      const deletedCard = cards.find((c) => c.id === deleteId);
      await api.delete(`/decks/my/decks/${id}/cards/${deleteId}`);
      setCards((prev) => prev.filter((c) => c.id !== deleteId));
      setTotal((t) => t - 1);
      setDeck((d) => d ? { ...d, _count: { cards: d._count.cards - 1 } } : d);
      if( deletedCard?.type === "BLACK" ) setBlackCount((c) => c - 1);
      if( deletedCard?.type === "WHITE" ) setWhiteCount((c) => c - 1);
    }finally{
      setDeleteId(null);
    }
  };

  const handleFilterChange = (f: FilterType) => { setFilter(f); setPage(1); };
  const handleSearch = (s: string) => { setSearch(s); setPage(1); };

  // Pagination helpers
  const paginationItems = (): (number | "...")[] => {
    if( pages <= 5 ) return Array.from({ length: pages }, (_, i) => i + 1);
    const items: (number | "...")[] = [1, 2, 3];
    if( page > 4 ) items.push("...");
    if( page > 3 && page < pages - 2 ){ items.push(page); }
    if( page < pages - 3 ) items.push("...");
    items.push(pages);
    return [...new Set(items)];
  };

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      {/* DELETE MODAL */}
      {
        deleteId &&
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={ () => setDeleteId(null) }>
          <div className="modal_container" onClick={ (e) => e.stopPropagation() }>
            <div className="modal_title" style={{ color: C.base }}>{ t("mydecks.deleteCard") }</div>
            <p className="modal_body" style={{ color: C.muted }}>{ t("mydecks.deleteConfirmCard") }</p>
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
                onClick={ handleDelete } 
              >
                { t("myroom.delete") }
              </button>
            </div>
          </div>
        </div>
      }
      {/* ADD / EDIT MODAL */}
      {
        modal &&
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={closeModal}>
          <div className="modal_container" onClick={(e) => e.stopPropagation()}>
            <div className="modal_title" style={{ color: C.base }}>{ modal.mode === "add" ? t("mydecks.newCard") : t("mydecks.editCard") }</div>
            {
              modal.mode === "add" &&
              <div className={ styles.modal_add_container }>
                {
                  (["BLACK", "WHITE"] as const).map((type) => (
                  <button
                    key={ type }
                    onClick={() => setModalForm((f) => ({ ...f, type }))}
                    className="langBt"
                    style={{
                      border: `1.5px solid ${ modalForm.type === type ? C.accent : C.border }`,
                      background: modalForm.type === type ? `color-mix(in srgb, ${ C.accent } 10%, #fff)` : "#fff", 
                      color: C.base
                    }}
                  >
                    { type === "BLACK" ? t("hero.question") : t("mydecks.white") }
                  </button>
                ))}
              </div>
            }
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label className="form_label" style={{ color: C.muted, marginBottom: 0 }}>{ t("mydecks.cardText") }</label>
                {
                  modalForm.type === "BLACK" &&
                  <button
                    type="button"
                    onClick={ insertGap }
                    className={ styles.btn_gap }
                    style={{ 
                      color: C.accent, 
                      border: `1.5px solid ${ C.accent }`
                    }}
                  >
                    { t("mydecks.insertGap") }
                  </button>
                }
              </div>
              <textarea
                ref={ textareaRef }
                className="input textarea"
                rows={ 5 }
                autoFocus
                value={ modalForm.text }
                onChange={(e) => setModalForm((f) => ({ ...f, text: e.target.value }))}
                placeholder={ modalForm.type === "BLACK" ? t("mydecks.cardQPlaceholder") : t("mydecks.cardAPlaceholder") }
                style={{ 
                  border: `1.5px solid ${ C.border }`, 
                  color: C.base, 
                }}
              />
            </div>
            <Button
              bgColor={ C.accent }
              textColor="#000"
              disabled={ !modalForm.text.trim() || saving }
              onClick={ handleSave }
              style={{ width: "100%"}}
            >
              { 
                saving 
                  ? "..." 
                  : modal.mode === "add" ? t("mydecks.addCard") : t("mydecks.saveCard") 
              }
            </Button>
          </div>
        </div>
      }
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <TopMenuMyAccount />
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
        <div className={ styles.title } style={{ color: C.faint }}>{ t("mydecks.1deck") }</div>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className={ styles.maze_square } style={{ background: C.base }} />
            <div>
              <div className="heading_1" style={{ fontSize: 22, color: C.base }}>{ deck?.name ?? "..." }</div>
              <div className={ styles.maze_sub } style={{ color: C.faint }}>
                { deck?._count.cards ?? 0}{" "}{ t( (deck?._count.cards ?? 0) > 0 ? "mydecks.cards" : "mydecks.card") }{" "}-{" "}{ deck?.language === "ES" ? t("nav.spanish") : t("nav.english") }
              </div>
            </div>
          </div>
          <div className="filter_search">
            <div style={{ position: "relative" }}>
              <span className="search_icon" style={{ color: C.faint }}>⌕</span>
              <input
                className="input search"
                style={{ border: `1.5px solid ${C.border}`, color: C.base, paddingTop: 10, paddingBottom: 10 }}
                placeholder={ t("mydecks.searchCard") }
                value={ search }
                onChange={ (e) => handleSearch(e.target.value) }
              />
            </div>
            <Button
              onClick={ openAdd }
              bgColor={ C.accent } 
              textColor="#000"
              size="sm"
            >
              + { t("mydecks.newCard") }
            </Button>
          </div>
        </div>
        {/* FILTER PILLS */}
        <div className="right_chips_container" style={{ marginBottom: 20 }}>
          {
            ([["ALL", t("myroom.filter_all")], ["BLACK", t("mydecks.questions")], ["WHITE", t("mydecks.answers")]] as [FilterType, string][]).map(([f, label]) => (
              <button
                key={ f }
                onClick={ () => handleFilterChange(f) }
                className="right_chips"
                style={{
                  border: `1.5px solid ${ filter === f ? C.accent : C.border }`, 
                  background: filter === f ? `color-mix(in srgb, ${C.accent} 10%, #fff)` : "#fff", 
                  color: C.base
                }}
              >
                { label }{f === "ALL" ? ` · ${deck?._count.cards ?? 0}` : f === "BLACK" ? ` · ${blackCount}` : ` · ${whiteCount}`}
              </button>
            ))
          }
        </div>
        {/* CARDS LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {
            loading 
            ? <p className="loading" style={{ color: C.base }}>{ t("myroom.loading") }</p>
            : 
              cards.length === 0 
              ? <p className="loading" style={{ color: C.base }}>{ t("mydecks.nocards") }</p>
              : cards.map((card) => (
                <div 
                  key={ card.id } 
                  className={ styles.card }
                  style={{ border: `1.5px solid ${ C.borderMid }` }}
                >
                  <span 
                    className={ styles.card_type }
                    style={{
                      background: card.type === "BLACK" ? C.base : "#fff",
                      color: card.type === "BLACK" ? "#fff" : C.muted,
                      border: card.type === "BLACK" ? "none" : `1.5px solid ${ C.border }`,
                    }}
                  >
                    { card.type === "BLACK" ? t("hero.question") : t("mydecks.white") }
                  </span>
                  <span className={ styles.card_text } style={{ color: C.base }}>
                    <BlackCardText text={ card.text } color={ C.base } />
                  </span>
                  <UnderlineLink onClick={() => openEdit(card)}>{ t("mydecks.edit") }</UnderlineLink>
                  <button 
                    onClick={ () => setDeleteId(card.id) } 
                    className="btn_red"
                    style={{ fontSize: 14 }}
                  >
                    ✕
                  </button>
            </div>
          ))}
        </div>
        {/* PAGINATION */}
        {
          pages > 1 &&
          <div className={ styles.page_container }>
            <span style={{ fontSize: 14, color: C.faint }}>
              { t("mydecks.showing") }{" "}{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}{" "}{ t("mydecks.of") } {total} { t("mydecks.cards") }
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                className={ styles.page_btn }
                onClick={ () => setPage((p) => Math.max(1, p - 1)) } 
                disabled={ page === 1 } 
                style={{ 
                  border: `1.5px solid ${ C.border }`, 
                  color: page === 1 ? C.faint : C.base, 
                  cursor: page === 1 ? "not-allowed" : "pointer", 
                }}>‹</button>
              {
                paginationItems().map((item, i) =>
                  item === "..." 
                  ? <span key={ `ellipsis-${i}` }className={ styles.page_btn_3p } style={{ color: C.base }}>...</span>
                  : 
                    <button 
                      key={ item } 
                      onClick={ () => setPage(item as number) } 
                      className={ styles.page_btn }
                      style={{ 
                        border: `1.5px solid ${ C.border }`, 
                        background: page === item ? C.base : "#fff", 
                        color: page === item ? "#fff" : C.base, 
                        cursor: "pointer", 
                        fontSize: 14 
                      }}
                    >{ item }</button>
                )
              }
              <button 
                className={ styles.page_btn }
                onClick={ () => setPage((p) => Math.min(pages, p + 1)) } 
                disabled={ page === pages } 
                style={{ 
                  border: `1.5px solid ${ C.border }`, 
                  color: page === pages ? C.faint : C.base, 
                  cursor: page === pages ? "not-allowed" : "pointer", 
                }}>›</button>
            </div>
          </div>
        }
        </div>
      <Footer />
    </div>
  );
};