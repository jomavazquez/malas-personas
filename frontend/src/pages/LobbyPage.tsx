import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Footer, Logo, TopMenuMyAccount } from "../components";
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
  const [ pointsToWin, setPointsToWin ] = useState(5);
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
    if( !selectedDeck || !roomName.trim() ) return;
    setError("");
    setLoading(true);
    try{
      const data = await api.post<{ room: { code: string } }>("/rooms", {
        deckId: selectedDeck,
        maxPlayers,
        pointsToWin,
        name: roomName.trim(),
      });
      navigate(`/room/${data.room.code}`, {
        state: { guestId: user!.id, guestName: user!.username },
      });
    }catch( err: unknown ){
      const code = (err as Error).message;
      setError(t(`errors.${code}`, code));
    }finally{
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if( joinCode.length < 6 || !guestName.trim() ) return;
    const guestId = user ? user.id : getOrCreateGuestId();
    navigate(`/room/${joinCode.toUpperCase()}`, {
      state: { guestId, guestName: guestName.trim() },
    });
  };

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full my-2 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <Logo />
          <TopMenuMyAccount />
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* ── CREATE ROOM ── */}
          <div className="cta_container" style={{ border: `1px solid ${C.borderMid}` }}>
            <Badge>{ t("lobby.newGame") }</Badge>
            <h2 className="cta_title" style={{ color: C.base }}>{ t("nav.createRoom") }</h2>
            <div style={{ marginBottom: 15 }}>
              <label className="form_label">{ t("lobby.roomName") }</label>
              <input
                className="input"
                style={{ border: `1.5px solid ${C.border}`, color: C.base }}
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
                {
                  decks.map((d) => (
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
            {/* PLAYERS + POINTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 25 }}>
              <div>
                <label className="form_label">{ t("lobby.maxPlayers") }</label>
                <div className={ styles.btn_container }>
                  <Button 
                    onClick={ () => setMaxPlayers(Math.max(2, maxPlayers - 1)) } 
                    style={{ fontSize: 20, padding: 15 }}>-</Button>
                  <span className={`input ${ styles.span_input }`} style={{ color: C.base, border: `1.5px solid ${C.border}` }}>{ maxPlayers }</span>
                  <Button 
                    bgColor={ C.accent }
                    textColor="#000"
                    onClick={ () => setMaxPlayers(Math.min(20, maxPlayers + 1)) }
                    style={{ fontSize: 20, padding: 15 }}>+</Button>
                </div>
              </div>
              <div>
                <label className="form_label">{t("lobby.pointsToWin")}</label>
                <div className={ styles.btn_container }>
                  <Button 
                    onClick={() => setPointsToWin(Math.max(1, pointsToWin - 1))} 
                    style={{ fontSize: 20, padding: 15 }}>-</Button>
                  <span className={`input ${ styles.span_input }`} style={{ color: C.base, border: `1.5px solid ${C.border}` }}>{ pointsToWin }</span>
                  <Button 
                    bgColor={ C.accent }
                    textColor="#000"
                    onClick={() => setPointsToWin(Math.min(50, pointsToWin + 1))} 
                    style={{ fontSize: 20, padding: 15 }}>+</Button>                      
                </div>
              </div>
            </div>
            {
              error && 
              <p className="error" style={{ marginBottom: 15, marginTop: -10 }}>{ error }</p>
            }
            <Button
              bgColor={ C.accent }
              textColor="#000"
              onClick={ handleCreate }
              disabled={ loading || !selectedDeck || !roomName.trim() }
              style={{ width: "100%"}}
            >
              { loading ? "..." : `${t("nav.createRoom")} →`}
            </Button>
          </div>
          {/* ── JOIN ROOM ── */}
          <div className="cta_container" style={{ background: C.base }}>
            <div style={{ marginBottom: 25 }}>
              <label className="form_label" style={{ color: "#fff", marginBottom: 5 }}>{ t("auth.username") }</label>
              <p className={ styles.form_label_sub }>{ t("lobby.yourNameSub") }</p>
              <input
                className="input"
                style={{ color: C.base, background: "#fff" }}
                placeholder="Marina"
                value={ guestName }
                onChange={ (e) => setGuestName(e.target.value) }
                maxLength={ 20 }
                readOnly={ !!user }
              />
            </div>
            {/* DIVIDER */}
            <div className={ styles.dividerContainer }>
              <div className={ styles.divider } />
              <span style={{ fontSize: 13, color: "#9AA3AB" }}>{ t("lobby.invitedToRoom") }</span>
              <div className={ styles.divider } />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form_label" style={{ color: "#fff", marginBottom: 5 }}>{t("lobby.roomCode")}</label>
              <input
                className="input_code"
                style={{ color: C.base }}
                placeholder="XXXXXX"
                value={ joinCode }
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
                  setCodeChars(val.padEnd(6, "").split("").slice(0, 6));
                }}
                maxLength={ 6 }
                onKeyDown={ (e) => e.key === "Enter" && handleJoin() }
              />
            </div>
            <button
              className="box_btn"
              onClick={ handleJoin }
              disabled={ joinCode.length < 6 || !guestName.trim() }
              style={{ 
                background: joinCode.length < 6 || !guestName.trim() ? "#3C424A" : C.accent, 
                color: joinCode.length < 6 || !guestName.trim() ? "#9AA3AB" : C.base, 
                cursor: joinCode.length < 6 || !guestName.trim() ? "not-allowed" : "pointer", 
              }}
            >
              { t("lobby.joinRoom2") }
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};