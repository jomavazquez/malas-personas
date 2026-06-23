import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { Button, Footer, Logo, TopMenuMyAccount } from "../components";
import { api, C, F } from "../lib";
import type { Room } from "../types";
import styles from "./MyRoomsPage.module.css";

type Filter = "all" | "active" | "finished";

export const MyRoomsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ rooms, setRooms ] = useState<Room[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ filter, setFilter ] = useState<Filter>("active");
  const [ search, setSearch ] = useState("");
  const [ copiedId, setCopiedId ] = useState<string | null>(null);
  const [ deleteCode, setDeleteCode ] = useState<string | null>(null);

  const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ pillStyle, setPillStyle ] = useState({ left: 0, width: 0 });
  const filters: Filter[] = ["active", "finished", "all"];

  useLayoutEffect(() => {
    const idx = filters.indexOf(filter);
    const btn = filterRefs.current[idx];
    if (btn) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [filter, i18n.language]);

  useEffect(() => {
    api.get<{ rooms: Room[] }>("/rooms/my").then((data) => {
      setRooms(data.rooms);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteCode) return;
    try {
      await api.patch(`/rooms/${deleteCode}/close`, {});
      setRooms((prev) => prev.filter((r) => r.code !== deleteCode));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteCode(null);
    }
  };

  const filtered = rooms
    .filter((r) => {
      if (filter === "active") return r.isActive;
      if (filter === "finished") return !r.isActive;
      return true;
    })
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    });

  const activeCount = rooms.filter((r) => r.isActive).length;

  return (
    <div style={{ background: C.surface, position: "relative" }}>

      {/* Delete confirmation modal */}
      {deleteCode && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeleteCode(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 360, width: "100%", boxShadow: "0 40px 80px -20px rgba(47,52,58,.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: C.base, marginBottom: 10 }}>
              {t("myRooms.deleteTitle", "Eliminar sala")}
            </div>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted, marginBottom: 24 }}>
              {t("myRooms.deleteConfirm", "¿Seguro que quieres eliminar esta sala? Esta acción no se puede deshacer.")}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteCode(null)}
                style={{ flex: 1, borderRadius: 12, padding: "12px 0", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: `1.5px solid ${C.border}`, background: "#fff", color: C.base, cursor: "pointer" }}
              >
                {t("myRooms.cancel", "Cancelar")}
              </button>
              <button
                onClick={handleDelete}
                style={{ flex: 1, borderRadius: 12, padding: "12px 0", fontFamily: F.display, fontWeight: 700, fontSize: 15, border: "none", background: "#DC2626", color: "#fff", cursor: "pointer" }}
              >
                {t("myRooms.delete", "Eliminar")}
              </button>
            </div>
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
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="heading_1" style={{ color: C.base }}>{ t("nav.myRooms") }</h1>
            <p className={ styles.text } style={{ color: C.muted }}>
              <strong>{ rooms.length }</strong> { t("myroom.saved") } · <strong>{ activeCount }</strong> { t("myroom.activeNow") }
            </p>
          </div>
          <Button bgColor={ C.accent } textColor="#000" onClick={() => navigate("/lobby")}>
            { t("nav.createRoom") } →
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div style={{ position: "relative", display: "flex", background: "#fff", borderRadius: 999, padding: 4, border: `1px solid ${C.border}` }}>
            <div style={{
              position: "absolute",
              top: 4, bottom: 4,
              left: pillStyle.left,
              width: pillStyle.width,
              borderRadius: 999,
              background: C.base,
              transition: "left 0.2s ease, width 0.2s ease",
              pointerEvents: "none",
            }} />
            {filters.map((f, i) => (
              <button
                key={f}
                ref={(el) => { filterRefs.current[i] = el; }}
                onClick={() => setFilter(f)}
                style={{
                  position: "relative", zIndex: 1,
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontFamily: F.display,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: filter === f ? "#fff" : C.muted,
                  transition: "color 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {t(`myRooms.filter_${f}`, f === "all" ? "Todas" : f === "active" ? "Activas" : "Finalizadas")}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.faint, fontSize: 14 }}>⌕</span>
            <input
              style={{ paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: F.body, fontSize: 14, color: C.base, outline: "none", background: "#fff", width: 240 }}
              placeholder={t("myRooms.search", "Buscar por nombre o código...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className={ styles.table } style={{ border: `1.5px solid ${ C.borderMid }` }}>
          {/* HEADER ROW */}
          <div className="hidden md:grid" style={{ gridTemplateColumns: "160px 1fr 140px 160px 200px", padding: "12px 24px", borderBottom: `1px solid ${C.border}` }}>
            {["lobby.code", "lobby.roomName", "room.players", "myroom.lastgame", ""].map((k, i) => (
              <div key={ i } className={ styles.table_th } style={{ color: C.faint }}>
                { k ? t(k, k.split("_")[1]) : "" }
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: C.muted, fontFamily: F.body }}>
              {t("myRooms.loading", "Cargando...")}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: C.muted, fontFamily: F.body }}>
              {t("myRooms.empty", "No hay salas que mostrar.")}
            </div>
          ) : (
            filtered.map((room, i) => (
              <div
                key={room.id}
                className="grid grid-cols-1 md:grid-cols-[160px_1fr_140px_160px_200px] gap-2 md:gap-0 items-center"
                style={{ padding: "16px 24px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderMid}` : "none" }}
              >
                {/* Code + copy */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ background: C.surface, borderRadius: 10, padding: "8px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 14, letterSpacing: "0.1em", color: C.base }}>{ room.code }</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(room.code);
                      setCopiedId(room.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${C.border}`, background: copiedId === room.id ? C.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: copiedId === room.id ? C.base : C.muted, transition: "all 0.15s" }}
                    title={t("room.copyCode")}
                  >
                    {copiedId === room.id ? "✓" : "⧉"}
                  </button>
                </div>

                {/* Room info */}
                <div className="md:pl-4">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: C.base }}>{room.name ?? room.code}</span>
                    {room.isActive ? (
                      <span style={{ background: `color-mix(in srgb, ${C.accent} 15%, #fff)`, color: C.accentDeep, border: `1px solid color-mix(in srgb, ${C.accent} 40%, transparent)`, borderRadius: 999, padding: "2px 10px", fontFamily: F.display, fontWeight: 700, fontSize: 11 }}>
                        ● {t("myRooms.active", "ACTIVA")}
                      </span>
                    ) : (
                      <span style={{ background: C.surface, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 10px", fontFamily: F.display, fontWeight: 700, fontSize: 11 }}>
                        {t("myRooms.finished", "FINALIZADA")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.faint, marginTop: 3 }}>
                    {room.deck?.language === "ES" ? "Español" : "English"} · {room.deck?.name}
                  </div>
                </div>

                {/* Players */}
                <div style={{ fontSize: 15, color: C.muted }}>
                  { room.maxPlayers }{" "}{ t("room.players").toLowerCase() }
                </div>

                {/* Last game */}
                <div style={{ fontSize: 15, color: C.muted }}>
                  {room.createdAt ? new Date(room.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}
                </div>

                {/* Actions */}
                <div className={ styles.table_actions }>
                  {
                    room.isActive && (
                    <>
                      <Button
                        size="sm"
                        bgColor={C.accent}
                        textColor="#000"
                        onClick={() => navigate(`/room/${room.code}`, { state: { guestId: user!.id, guestName: user!.username } })}
                        style={{ fontSize: 13 }}
                      >
                        { t("myroom.reopen") }
                      </Button>
                      <button
                        onClick={ () => setDeleteCode(room.code) }
                        style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid #FECACA`, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "#DC2626" }}
                        title={t("myRooms.delete", "Eliminar sala")}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};