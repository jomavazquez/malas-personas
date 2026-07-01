import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer, Logo, TopMenuMyAccount } from "../components";
import { api, C, F } from "../lib";

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

const PAGE_SIZE = 8;

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

  // Modal state
  const [ modal, setModal ] = useState<{ mode: "add" | "edit"; card?: Card } | null>(null);
  const [ modalForm, setModalForm ] = useState({ type: "BLACK" as "BLACK" | "WHITE", text: "" });
  const [ saving, setSaving ] = useState(false);
  const [ deleteId, setDeleteId ] = useState<string | null>(null);

  // Redirect if no deck in state
  useEffect(() => {
    if (!deckFromState) navigate("/my-decks");
  }, []);

  // Load cards
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter !== "ALL") params.set("type", filter);
    if (search.trim()) params.set("search", search.trim());
    api.get<{ cards: Card[]; total: number; pages: number }>(`/decks/my/decks/${id}/cards?${params}`)
      .then((data) => { setCards(data.cards); setTotal(data.total); setPages(data.pages); })
      .finally(() => setLoading(false));
  }, [id, page, filter, search]);

  const openAdd = () => { setModalForm({ type: "BLACK", text: "" }); setModal({ mode: "add" }); };
  const openEdit = (card: Card) => { setModalForm({ type: card.type, text: card.text }); setModal({ mode: "edit", card }); };
  const closeModal = () => { setModal(null); setModalForm({ type: "BLACK", text: "" }); };

  const handleSave = async () => {
    if (!modalForm.text.trim() || !id) return;
    setSaving(true);
    try {
      if (modal?.mode === "add") {
        const data = await api.post<{ card: Card }>(`/decks/my/decks/${id}/cards`, modalForm);
        setCards((prev) => [data.card, ...prev].slice(0, PAGE_SIZE));
        setTotal((t) => t + 1);
        setDeck((d) => d ? { ...d, _count: { cards: d._count.cards + 1 } } : d);
      } else if (modal?.mode === "edit" && modal.card) {
        const data = await api.patch<{ card: Card }>(`/decks/my/decks/${id}/cards/${modal.card.id}`, { text: modalForm.text });
        setCards((prev) => prev.map((c) => c.id === data.card.id ? data.card : c));
      }
      closeModal();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !id) return;
    try {
      await api.delete(`/decks/my/decks/${id}/cards/${deleteId}`);
      setCards((prev) => prev.filter((c) => c.id !== deleteId));
      setTotal((t) => t - 1);
      setDeck((d) => d ? { ...d, _count: { cards: d._count.cards - 1 } } : d);
    } finally {
      setDeleteId(null);
    }
  };

  const handleFilterChange = (f: FilterType) => { setFilter(f); setPage(1); };
  const handleSearch = (s: string) => { setSearch(s); setPage(1); };

  // Pagination helpers
  const paginationItems = (): (number | "...")[] => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    const items: (number | "...")[] = [1, 2, 3];
    if (page > 4) items.push("...");
    if (page > 3 && page < pages - 2) { items.push(page); }
    if (page < pages - 3) items.push("...");
    items.push(pages);
    return [...new Set(items)];
  };

  return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: F.body }}>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={() => setDeleteId(null)}>
          <div className="modal_container" onClick={(e) => e.stopPropagation()}>
            <div className="modal_title" style={{ color: C.base }}>{ t("mycards.deleteCard", "Eliminar carta") }</div>
            <p className="modal_body" style={{ color: C.muted }}>{ t("mycards.deleteConfirm", "Esta acción no se puede deshacer.") }</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, borderRadius: 12, padding: "12px 0", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: `1.5px solid ${C.border}`, background: "#fff", color: C.base, cursor: "pointer" }}>
                { t("myroom.cancel", "Cancelar") }
              </button>
              <button onClick={handleDelete} style={{ flex: 1, borderRadius: 12, padding: "12px 0", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: "none", background: "#DC2626", color: "#fff", cursor: "pointer" }}>
                { t("mydecks.delete", "Eliminar") }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={closeModal}>
          <div className="modal_container" onClick={(e) => e.stopPropagation()}>
            <div className="modal_title" style={{ color: C.base }}>
              { modal.mode === "add" ? t("mycards.addCard", "Nueva carta") : t("mycards.editCard", "Editar carta") }
            </div>
            {/* Type selector - only for new cards */}
            {modal.mode === "add" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {(["BLACK", "WHITE"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setModalForm((f) => ({ ...f, type }))}
                    style={{
                      borderRadius: 12, padding: "11px 0", fontFamily: F.display, fontWeight: 600, fontSize: 14,
                      border: `1.5px solid ${modalForm.type === type ? C.accent : C.border}`,
                      background: modalForm.type === type ? `color-mix(in srgb, ${C.accent} 10%, #fff)` : "#fff",
                      color: C.base, cursor: "pointer",
                    }}
                  >
                    { type === "BLACK" ? t("mycards.question", "Pregunta") : t("mycards.answer", "Respuesta") }
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label className="form_label" style={{ color: C.muted }}>{ t("mycards.cardText", "Texto de la carta") }</label>
              <textarea
                rows={4}
                autoFocus
                value={modalForm.text}
                onChange={(e) => setModalForm((f) => ({ ...f, text: e.target.value }))}
                placeholder={ modalForm.type === "BLACK" ? "La daily de diseño: ____." : "Un Figma con 412 capas sin nombrar." }
                style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontFamily: F.body, fontSize: 15, color: C.base, outline: "none", resize: "vertical" }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!modalForm.text.trim() || saving}
              style={{ width: "100%", background: !modalForm.text.trim() ? "#ccc" : C.accent, color: C.base, borderRadius: 12, padding: "14px 0", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: "none", cursor: !modalForm.text.trim() ? "not-allowed" : "pointer" }}
            >
              { saving ? "..." : modal.mode === "add" ? t("mycards.add", "Añadir carta") : t("mycards.save", "Guardar cambios") }
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center px-4 md:px-14 pt-6 md:pt-8 pb-4">
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
          <TopMenuMyAccount />
        </div>
      </nav>

      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-8">

        {/* Header */}
        <div style={{ marginBottom: 8, fontFamily: F.display, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint }}>
          { t("mydecks.title", "MAZO") }
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.base, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, color: C.base }}>{deck?.name ?? "..."}</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.faint }}>
                {deck?._count.cards ?? 0} { t("mycards.cards", "cartas") }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.faint, fontSize: 14 }}>⌕</span>
              <input
                style={{ paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: F.body, fontSize: 14, color: C.base, outline: "none", background: "#fff", width: 200 }}
                placeholder={ t("mycards.search", "Buscar carta...") }
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              style={{ background: C.accent, color: C.base, borderRadius: 14, padding: "11px 20px", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: `0 8px 20px -8px color-mix(in srgb, ${C.accent} 60%, transparent)` }}
            >
              + { t("mycards.newCard", "Nueva carta") }
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([["ALL", t("mycards.all", "Todas")], ["BLACK", t("mycards.questions", "Preguntas")], ["WHITE", t("mycards.answers", "Respuestas")]] as [FilterType, string][]).map(([f, label]) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              style={{
                borderRadius: 999, padding: "7px 16px", fontFamily: F.display, fontWeight: 600, fontSize: 14,
                border: `1.5px solid ${filter === f ? C.accent : C.border}`,
                background: filter === f ? `color-mix(in srgb, ${C.accent} 12%, #fff)` : "#fff",
                color: C.base, cursor: "pointer",
              }}
            >
              {label}{f === "ALL" ? ` · ${total}` : f === "BLACK" ? ` · ${deck?._count.cards ?? 0}` : ""}
            </button>
          ))}
        </div>

        {/* Cards list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {loading ? (
            <p style={{ fontFamily: F.body, color: C.muted, padding: "20px 0" }}>{ t("myroom.loading", "Cargando...") }</p>
          ) : cards.length === 0 ? (
            <p style={{ fontFamily: F.body, color: C.muted, padding: "20px 0" }}>{ t("mycards.empty", "No hay cartas.") }</p>
          ) : cards.map((card) => (
            <div key={card.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", border: `1px solid ${C.borderMid}`, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                borderRadius: 999, padding: "3px 10px", fontFamily: F.display, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em",
                background: card.type === "BLACK" ? C.base : "#fff",
                color: card.type === "BLACK" ? "#fff" : C.muted,
                border: card.type === "BLACK" ? "none" : `1.5px solid ${C.border}`,
                flexShrink: 0,
              }}>
                { card.type === "BLACK" ? t("mycards.question", "PREGUNTA") : t("mycards.answer", "RESPUESTA") }
              </span>
              <span style={{ flex: 1, fontFamily: F.body, fontSize: 15, color: C.base }}>{card.text}</span>
              <button onClick={() => openEdit(card)} style={{ fontFamily: F.display, fontWeight: 600, fontSize: 14, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
                { t("mycards.edit", "Editar") }
              </button>
              <button onClick={() => setDeleteId(card.id)} style={{ color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>✕</button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.faint }}>
              { t("mycards.showing", "Mostrando") } {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} { t("mycards.of", "de") } {total} { t("mycards.cards", "cartas") }
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: page === 1 ? C.faint : C.base, cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: F.display, fontWeight: 700 }}>‹</button>
              {paginationItems().map((item, i) =>
                item === "..." ? (
                  <span key={`ellipsis-${i}`} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontFamily: F.display }}>…</span>
                ) : (
                  <button key={item} onClick={() => setPage(item as number)} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${page === item ? C.accent : C.border}`, background: page === item ? C.base : "#fff", color: page === item ? "#fff" : C.base, cursor: "pointer", fontFamily: F.display, fontWeight: 700, fontSize: 14 }}>
                    {item}
                  </button>
                )
              )}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: page === pages ? C.faint : C.base, cursor: page === pages ? "not-allowed" : "pointer", fontFamily: F.display, fontWeight: 700 }}>›</button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};