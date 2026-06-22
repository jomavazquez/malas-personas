import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Badge, Footer, Logo, TopMenu } from "../components";
import { api, C, F } from "../lib";
import { getOrCreateGuestId } from "../lib/guest";
import type { Deck } from "../types";
import styles from "./LobbyPage.module.css";

export const LobbyPage = () => {

  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create room state
  const [ decks, setDecks ] = useState<Deck[]>([]);
  const [ roomName, setRoomName ] = useState("");
  const [ selectedLang, setSelectedLang ] = useState<"ES" | "EN">( i18n.language.startsWith("es") ? "ES" : "EN" );
  const [ selectedDeck, setSelectedDeck ] = useState("");
  const [ maxPlayers, setMaxPlayers ] = useState(10);
  const [ pointsToWin, setPointsToWin ] = useState(7);
  const [ error, setError ] = useState("");
  const [ loading, setLoading ] = useState(false);

  // Join room state
  const [ guestName, setGuestName ] = useState(user?.username ?? "");
  const [ codeChars, setCodeChars ] = useState<string[]>(Array(6).fill(""));

  const joinCode = codeChars.join("");

  useEffect(() => {
    api.get<{ decks: Deck[] }>("/decks").then((data) => {
      const filtered = data.decks.filter((d) => d.language === selectedLang);
      const list = filtered.length ? filtered : data.decks;
      setDecks(list);
      if( list.length ) setSelectedDeck(list[0].id);
    });
  }, [ selectedLang ]);

  const handleCreate = async () => {
    if (!selectedDeck || !roomName.trim()) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ room: { code: string } }>("/rooms", {
        deckId: selectedDeck,
        maxPlayers,
        pointsToWin,
        name: roomName.trim(),
      });
      navigate(`/room/${data.room.code}`, {
        state: { guestId: user!.id, guestName: user!.username },
      });
    } catch (err: unknown) {
      const code = (err as Error).message;
      setError(t(`errors.${code}`, code));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (joinCode.length < 6 || !guestName.trim()) return;
    const guestId = user ? user.id : getOrCreateGuestId();
    navigate(`/room/${joinCode.toUpperCase()}`, {
      state: { guestId, guestName: guestName.trim() },
    });
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: F.display, fontWeight: 700, fontSize: 11,
    letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted,
    marginBottom: 8, display: "block",
  };

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center px-4 md:px-14 h-16 pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
          <TopMenu />
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ── CREATE ROOM ── */}
          <div className="cta_container" style={{ border: `1px solid ${C.borderMid}` }}>
            <Badge>{ t("lobby.newGame") }</Badge>
            <h2 className="cta_title" style={{ color: C.base }}>{ t("lobby.createRoom") }</h2>
            <div style={{ marginBottom: 15 }}>
              <label className="form_label">{ t("lobby.roomName") }</label>
              <input
                className="input"
                style={{ border: `1.5px solid ${C.border}`, color: C.faint }}
                placeholder="Squad A"
                value={ roomName }
                onChange={ (e) => setRoomName(e.target.value) }
                maxLength={ 40 }
              />
            </div>
            <div style={{ marginBottom: 25 }}>
              <label className="form_label">{ t("lobby.gameLang") }</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {
                  (["EN", "ES"] as const).map((lang) => (
                  <button 
                    key={ lang } 
                    className={ styles.langBt }
                    onClick={ () => setSelectedLang(lang) } 
                    style={{ border: `1.5px solid ${ selectedLang === lang ? C.accent : C.border }`, background: selectedLang === lang ? `color-mix(in srgb, ${ C.accent } 10%, #fff)` : "#fff", color: C.base }}>
                    { 
                      selectedLang === lang && 
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, display: "inline-block" }} />
                    }
                    {
                      lang === "EN" ? "English" : "Español"
                    }
                  </button>
                ))}
              </div>
            </div>
            {/* Deck chips */}
            <div style={{ marginBottom: 25 }}>
              <label className="form_label">{ t("lobby.selectDeck") }</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {decks.map((d) => (
                  <button key={d.id} onClick={() => setSelectedDeck(d.id)} style={{
                    borderRadius: 999, padding: "8px 16px", fontFamily: F.display, fontWeight: 600, fontSize: 14,
                    border: `1.5px solid ${selectedDeck === d.id ? C.accent : C.border}`,
                    background: selectedDeck === d.id ? `color-mix(in srgb, ${C.accent} 10%, #fff)` : "#fff",
                    color: C.base, cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Players + Points */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>{t("lobby.maxPlayers")} <span style={{ color: C.faint, fontWeight: 400 }}>2-20</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    className={ styles.incdec }
                    onClick={ () => setMaxPlayers(Math.max(2, maxPlayers - 1)) } 
                    style={{ border: `1.5px solid ${C.border}`, color: C.base }}>−</button>
                  <span 
                    className="input"
                    style={{ flex: 1, textAlign: "center", fontFamily: F.display, fontWeight: 800, fontSize: 20, color: C.base, border: `1.5px solid ${C.border}` }}>
                      { maxPlayers }
                  </span>
                  <button 
                    className={ styles.incdec }
                    onClick={() => setMaxPlayers(Math.min(20, maxPlayers + 1))} 
                    style={{ border: `1.5px solid ${C.border}`, background: C.accent, color: C.base }}>+</button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("lobby.pointsToWin")}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    className={ styles.incdec }
                    onClick={() => setPointsToWin(Math.max(1, pointsToWin - 1))} 
                    style={{ border: `1.5px solid ${C.border}`, color: C.base }}>−</button>
                  <span 
                    className="input"
                    style={{ flex: 1, textAlign: "center", fontFamily: F.display, fontWeight: 800, fontSize: 20, color: C.base, border: `1.5px solid ${C.border}` }}>
                      { pointsToWin }</span>
                  <button 
                    className={ styles.incdec }
                    onClick={() => setPointsToWin(Math.min(50, pointsToWin + 1))} 
                    style={{ border: `1.5px solid ${C.border}`, background: C.accent, color: C.base }}>+</button>
                </div>
              </div>
            </div>

            {error && <p style={{ color: "#E5534B", fontSize: 14, marginBottom: 12 }}>{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading || !selectedDeck || !roomName.trim()}
              style={{ width: "100%", background: loading || !selectedDeck || !roomName.trim() ? "#ccc" : C.accent, color: C.base, borderRadius: 14, padding: "17px 0", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: loading || !selectedDeck || !roomName.trim() ? "not-allowed" : "pointer", boxShadow: !loading && selectedDeck && roomName.trim() ? `0 16px 30px -14px color-mix(in srgb, ${C.accent} 60%, transparent)` : "none", letterSpacing: "-0.01em" }}
            >
              {loading ? "..." : `${t("lobby.create")} →`}
            </button>
          </div>

          {/* ── JOIN ROOM ── */}
          <div style={{ background: C.base, borderRadius: 24, padding: "36px 34px", boxShadow: "0 20px 50px -20px rgba(47,52,58,.4)" }}>

            {/* Name */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ ...labelStyle, color: "#9AA3AB" }}>{t("lobby.yourName", "Tu nombre")}</label>
              <p style={{ fontFamily: F.body, fontSize: 13, color: "#9AA3AB", marginBottom: 10 }}>
                {t("lobby.yourNameSub", "Así te verán el resto de jugadores en la partida.")}
              </p>
              <input
                className="input"
                style={{ border: "1.5px solid #3C424A", color: C.base, background: "#fff" }}
                placeholder="Ej. Marina"
                value={ guestName }
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={20}
                readOnly={!!user}
              />
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "#3C424A" }} />
              <span style={{ fontFamily: F.body, fontSize: 12, color: "#9AA3AB" }}>
                {t("lobby.invitedToRoom", "¿te invitaron a una sala?")}
              </span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* Code input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, color: "#9AA3AB" }}>{t("lobby.roomCode")}</label>
              <input
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "2px solid #3C424A", borderRadius: 10,
                  padding: 15, outline: "none",
                  fontFamily: F.display, fontWeight: 800, fontSize: 28,
                  letterSpacing: "0.12em", textAlign: "center",
                  color: C.base, background: "#fff", marginBottom: 0,
                }}
                placeholder="XXXXXX"
                value={joinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
                  setCodeChars(val.padEnd(6, "").split("").slice(0, 6));
                }}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={joinCode.length < 6 || !guestName.trim()}
              style={{ width: "100%", background: joinCode.length < 6 || !guestName.trim() ? "#3C424A" : C.accent, color: joinCode.length < 6 || !guestName.trim() ? "#9AA3AB" : C.base, borderRadius: 14, padding: "17px 0", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: joinCode.length < 6 || !guestName.trim() ? "not-allowed" : "pointer", letterSpacing: "-0.01em" }}
            >
              {t("lobby.joinRoom2", "Unirse a la sala")}
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};