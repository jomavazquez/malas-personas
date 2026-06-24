import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { C, F, getOrCreateGuestId, connectSocket } from "../lib";
import { Footer, Logo, TopMenu, TopMenuMyAccount, RoomNotFound, Avatar } from "../components";
import type { Player, GameState } from "../types";
import styles from "./RoomPage.module.css";

export const RoomPage = () => {

  const { t } = useTranslation();
  const { user } = useAuth();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const guestId: string | undefined = location.state?.guestId;
  const guestName: string | undefined = location.state?.guestName;

  const myId = user?.id ?? guestId ?? "";
  const myName = user?.username ?? guestName ?? "";
  const isGuest = !user;

  const [ players, setPlayers ] = useState<Player[]>([]);
  const [ hostId, setHostId ] = useState<string | null>(null);
  const [ copied, setCopied ] = useState(false);
  const [ error, setError ] = useState("");
  const [ connected, setConnected ] = useState(false);
  const [ nameInput, setNameInput ] = useState("");
  const [ resolvedName, setResolvedName ] = useState(myName);
  const [ resolvedId, setResolvedId ] = useState(myId);

  const isHost = resolvedId === hostId;
  const canStart = players.length >= 2;

  // Si no hay identidad, mostrar formulario de nombre
  const needsName = !resolvedName;

  const handleStart = () => {
    const socket = connectSocket();
    socket.emit("game:start", { roomCode: code }, (res: { error?: string }) => {
      if (res.error) setError(res.error);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    const id = getOrCreateGuestId();
    setResolvedId(id);
    setResolvedName(nameInput.trim());
  };

  useEffect(() => {
    if( !code || !resolvedId || !resolvedName ) return;
    const socket = connectSocket();

    socket.emit("room:join", { roomCode: code, userId: resolvedId, username: resolvedName, isGuest }, (res: { error?: string; state?: GameState }) => {
      if (res.error) { setError(res.error); return; }
      setConnected(true);
      setHostId(res.state!.players[0]?.userId ?? null);
      setPlayers(res.state!.players);
    });

    socket.on("room:playerJoined", ({ userId, username, isGuest: g }: { userId: string; username: string; isGuest: boolean }) => {
      setPlayers((prev) => prev.find((p) => p.userId === userId) ? prev : [...prev, { userId, username, score: 0, isGuest: g, isJudge: false }]);
    });

    socket.on("room:playerLeft", ({ userId }: { userId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.userId !== userId));
    });

    socket.on("game:started", () => navigate(`/game/${code}`));

    return () => {
      socket.off("room:playerJoined");
      socket.off("room:playerLeft");
      socket.off("game:started");
    };
  }, [ code, resolvedId, resolvedName, isGuest, navigate ]);

  useEffect(() => {
    setError("");
    setPlayers([]);
    setHostId(null);
    setConnected(false);
  }, [ code ]);  

  if( needsName ){
    return (
      <div style={{ background: C.surface, position: "relative" }}>
        <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
          <div className="max-w-360 mx-auto w-full flex items-center justify-between">
            <Logo />
            <TopMenu />
          </div>
        </nav>        
        <div style={{ background: "#fff", borderRadius: 24, padding: "38px 36px", width: "100%", maxWidth: 360, boxShadow: "0 30px 60px -34px rgba(47,52,58,.4)" }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: C.base, marginBottom: 8 }}>
            ¿Cómo te llaman?
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted, marginBottom: 20 }}>
            Sala <strong>{code}</strong> · Tu nombre será visible para los demás.
          </p>
          <input
            className="input"
            style={{ border: `1.5px solid ${C.border}`, color: C.base, marginBottom: 16 }}
            placeholder="Marina"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
            style={{ width: "100%", background: !nameInput.trim() ? "#ccc" : C.accent, color: C.base, borderRadius: 14, padding: "16px 0", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: !nameInput.trim() ? "not-allowed" : "pointer" }}
          >
            Entrar a la sala
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if( error ) return <RoomNotFound code={ code } error={ error } />;
  
  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
          {
            isGuest ? <TopMenu /> : <TopMenuMyAccount />
          }
        </div>
      </nav>
      <div style={{ maxWidth: 1340, margin: "0 auto", padding: 50 }}>
        <div style={{ 
          maxWidth: 480, margin: "0 auto" }}>

          {/* Code */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
              {t("room.shareCode")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, letterSpacing: "0.08em", color: C.base, lineHeight: 1 }}>{code}</span>
              <button onClick={handleCopy} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.muted, cursor: "pointer" }}>
                {copied ? t("room.copied") : t("room.copyCode")}
              </button>
            </div>
          </div>

          <div className={ styles.players_box } style={{ border: `1.5px solid ${ C.borderMid }`}}>
            <div className={ styles.players_th } style={{ color: C.faint }}>{ t("room.players") }{" "}({ players.length })</div>
            <div className={ styles.players_container }>
              {
                players.map((p, i) => (
                <div key={ p.userId } className={ styles.players_row }>
                  <Avatar 
                    user={ p.username } 
                    bgColor={ p.userId === myId ? C.accent : C.base } 
                    textColor={ p.userId === myId ? C.base : "#fff" }
                    showLabel 
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    {
                      p.userId === myId && 
                      <span className={ styles.you } style={{ color: C.accent }}>{ t("room.you") }</span>
                    }
                    {
                      i === 0 && 
                      <span className={ styles.you } style={{ color: C.muted }}>{ t("room.host") }</span>
                    }
                    {
                      p.isGuest && 
                      <span className={ styles.you } style={{ color: C.faint }}>{ t("room.guest") }</span>
                    }
                  </div>
                </div>
                ))
              }
            </div>
          </div>
          {
            isHost 
            ?
              <div>
                {
                  !canStart && 
                  <p className={ styles.p } style={{ color: C.muted }}>{ t("room.minPlayers") }</p>
                }
                <button onClick={handleStart} disabled={!canStart || !connected} style={{ width: "100%", background: !canStart || !connected ? "#ccc" : C.accent, color: C.base, borderRadius: 14, padding: "18px 0", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: !canStart || !connected ? "not-allowed" : "pointer", boxShadow: canStart ? `0 16px 30px -14px color-mix(in srgb, ${C.accent} 60%, transparent)` : "none" }}>
                  {t("room.start")}
                </button>
              </div>
            : <p className={ styles.p } style={{ color: C.muted, marginBottom: 0 }}>{ t("room.waiting") }</p>
          }
        </div>
      </div>
      <Footer />
    </div>
  );
};