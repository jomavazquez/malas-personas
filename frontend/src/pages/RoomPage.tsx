import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { C, getOrCreateGuestId, connectSocket } from "../lib";
import { Footer, Logo, TopMenu, TopMenuMyAccount, RoomNotFound, Avatar, Button } from "../components";
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
  const [ nameInput, setNameInput ] = useState(user?.username ?? "");
  const [ confirmed, setConfirmed ] = useState(!!guestName || !!user);
  const [ resolvedName, setResolvedName ] = useState(myName);
  const [ resolvedId, setResolvedId ] = useState(myId);
  const [ isGuestResolved, setIsGuestResolved ] = useState(!user && !!guestId);

  // Si el usuario carga después del primer render, actualiza resolvedName/resolvedId
  useEffect(() => {
    if (user?.username) {
      setResolvedName(user.username);
      setResolvedId(user.id);
      setNameInput(user.username);
      setIsGuestResolved(false);
    }
  }, [user?.username]);

  const isHost = resolvedId === hostId;
  const canStart = players.length >= 2;

  // Mostrar formulario hasta que el usuario confirme explícitamente
  const needsName = !confirmed;

  const handleStart = () => {
    const socket = connectSocket();
    socket.emit("game:start", { roomCode: code }, (res: { error?: string }) => {
      if( res.error ) setError(res.error);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    const id = user ? user.id : getOrCreateGuestId();
    setResolvedId(id);
    setResolvedName(nameInput.trim());
    setConfirmed(true);
  };

  useEffect(() => {
    setError("");
    setPlayers([]);
    setHostId(null);
    setConnected(false);
  }, [code]);

  useEffect(() => {
    if( !code || !resolvedId || !resolvedName ) return;
    const socket = connectSocket();

    socket.emit("room:join", { roomCode: code, userId: resolvedId, username: resolvedName, isGuest: isGuestResolved }, (res: { error?: string; state?: GameState }) => {
      if (res.error) { setError(res.error); return; }
      setConnected(true);
      console.log("state received:", res.state?.hostId, "myId:", resolvedId);
      setHostId(res.state!.hostId ?? null);
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



  if( needsName ){
    return (
      <div style={{ background: C.surface, position: "relative" }}>
        <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
          <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
            <Logo />
            {
              isGuest ? <TopMenu /> : <TopMenuMyAccount />
            }
          </div>
        </nav>
        <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
          <div className="mx-auto" style={{ maxWidth: 480 }}>
            <div className={ styles.players_box } style={{ border: `1.5px solid ${ C.borderMid }`}}>
              <div className="cta_title" style={{ color: C.base, marginBottom: 10 }}>{ t("room.yourName") }</div>
              <p className={ styles.desc } style={{ color: C.muted, marginBottom: 20 }}>{ t("myroom.room") }{" "}<strong>{ code }</strong>{ t("room.yourNameVisible") }</p>
              <input
                className="input"
                style={{ border: `1.5px solid ${C.border}`, color: C.base, marginBottom: 20 }}
                placeholder="Marina"
                value={ nameInput }
                onChange={ (e) => setNameInput(e.target.value) }
                maxLength={ 20 }
                autoFocus
                readOnly={ !!user }
                onKeyDown={ (e) => e.key === "Enter" && handleNameSubmit() }
              />
              <Button
                onClick={ handleNameSubmit }
                disabled={ !nameInput.trim() }
                bgColor={ !nameInput.trim() ? "#ccc" : C.accent }
                textColor="#000"
                style={{ width: "100%", boxShadow: nameInput.trim() ? `0 16px 30px -14px color-mix(in srgb, ${C.accent} 60%, transparent)` : "none" }}
              >
                { t("room.enter") }
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if( error ) return <RoomNotFound code={ code } error={ error } />;
  
  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          {
            isGuest ? <TopMenu /> : <TopMenuMyAccount />
          }
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
        <div className="mx-auto" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 25 }}>
            <div className={ styles.players_th } style={{ fontSize: 12, color: C.muted }}>{ t("room.shareCode") }</div>
            <div className={ styles.code_container }>
              <span className={ styles.code } style={{ color: C.base }}>{ code }</span>
              <button 
                onClick={ handleCopy } 
                className={ styles.btn }
                style={{ background: C.surface, border: `1.5px solid ${C.border}`, color: C.muted }}
              >
                {
                  copied ? t("room.copied") : t("room.copyCode")
                }
              </button>
            </div>
          </div>
          <div className={ styles.players_box } style={{ border: `1.5px solid ${ C.borderMid }`}}>
            <div className={ styles.players_th } style={{ color: C.faint }}>{ t("room.players") }{" "}({ players.length })</div>
            <div className={ styles.players_container }>
              {
                players.map((p) => (
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
                      p.userId === hostId && 
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
                <Button 
                  onClick={ handleStart } 
                  disabled={ !canStart || !connected } 
                  bgColor={ !canStart || !connected ? "#ccc" : C.accent }
                  textColor="#000"
                  style={{ boxShadow: canStart ? `0 16px 30px -14px color-mix(in srgb, ${C.accent} 60%, transparent)` : "none", cursor: !canStart || !connected ? "not-allowed" : "pointer", width: "100%" }}
                >
                  { t("room.start") }
                </Button>
              </div>
            : <p className={ styles.p } style={{ color: C.muted, marginBottom: 0 }}>{ t("room.waiting") }</p>
          }
        </div>
      </div>
      <Footer />
    </div>
  );
};