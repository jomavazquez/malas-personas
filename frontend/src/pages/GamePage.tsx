import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { C, F, connectSocket } from "../lib";
import { BlackCard, Button, Footer, Logo } from "../components";
import type { GameState, PlayedCard, Card } from "../types";
import styles from "./GamePage.module.css";

export const GamePage = () => {
 
  const { t } = useTranslation();
  const { user } = useAuth();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const guestId: string | undefined = location.state?.guestId;
  const guestName: string | undefined = location.state?.guestName;
  const myId = user?.id ?? guestId ?? "";
  const myName = user?.username ?? guestName ?? "";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [revealedCards, setRevealedCards] = useState<PlayedCard[] | null>(null);
  const [roundResult, setRoundResult] = useState<{ winner: { userId: string; username: string; score: number }; winningCard: Card } | null>(null);
  const [gameOver, setGameOver] = useState<{ userId: string; username: string; score: number } | null>(null);
  const [playedCount, setPlayedCount] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const isJudge = gameState?.judge?.userId === myId;
  const totalNeeded = (gameState?.players?.length ?? 1) - 1;

  useEffect(() => {
    if( !code || !myId || !myName ) return;
    const socket = connectSocket();

    socket.emit("room:join", { roomCode: code, userId: myId, username: myName, isGuest: !user }, (res: { error?: string; state?: GameState }) => {
      if( res.error ){ navigate("/"); return; }
      setGameState(res.state!);
      setHand(res.state!.hand ?? []);
    });

    socket.on("hand:update", ({ hand: h }: { hand: Card[] }) => { setHand(h); setSelectedCard(null); });

    socket.on("round:new", ({ blackCard, judge }: { blackCard: Card; judge?: GameState["judge"] }) => {
      setGameState((s) => s ? { ...s, currentBlackCard: blackCard, judge: judge ?? s.judge } : s);
      setHasPlayed(false);
      setRevealedCards(null);
      setRoundResult(null);
      setPlayedCount(0);
      setSelectedWinner(null);
      // selectedCard se limpia cuando llegan nuevas cartas (hand:update)
    });

    socket.on("round:cardPlayed", ({ playedCount: c }: { playedCount: number }) => setPlayedCount(c));
    socket.on("round:reveal", ({ cards }: { cards: PlayedCard[] }) => setRevealedCards(cards));

    socket.on("round:winner", ({ winner, winningCard, scores }: { winner: { userId: string; username: string; score: number }; winningCard: Card; scores: GameState["players"] }) => {
      setRoundResult({ winner, winningCard });
      setGameState((s) => s ? { ...s, players: scores } : s);
    });

    socket.on("game:over", ({ winner }: { winner: { userId: string; username: string; score: number } }) => setGameOver(winner));

    socket.on("room:playerLeft", ({ userId }: { userId: string }) => {
      setGameState((s) => s ? { ...s, players: s.players.filter((p) => p.userId !== userId) } : s);
    });

    return () => {
      socket.off("hand:update");
      socket.off("round:new");
      socket.off("round:cardPlayed");
      socket.off("round:reveal");
      socket.off("round:winner");
      socket.off("game:over");
      socket.off("room:playerLeft");
    };
  }, [ myId, myName, code, navigate ]);

  const handlePlayCard = ( cardId: string ) => {
    if( hasPlayed || isJudge ) return;
    setSelectedCard(cardId);
  };

  const handleSendCard = () => {
    if( !selectedCard || hasPlayed || isJudge ) return;
    const socket = connectSocket();
    socket.emit("round:playCard", { roomCode: code, cardId: selectedCard }, (res: { error?: string }) => {
      if( res.error ){ alert(res.error); return; }
      setHasPlayed(true);
    });
  };

  const handlePickWinner = ( winnerUserId: string ) => {
    if( roundResult ) return;
    setSelectedWinner(winnerUserId);
    const socket = connectSocket();
    socket.emit("round:pickWinner", { roomCode: code, winnerUserId }, (res: { error?: string }) => {
      if( res.error ){ alert(res.error); setSelectedWinner(null); }
    });
  };

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div style={{ minHeight: "100vh", background: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: F.body }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 56, letterSpacing: "-0.04em", color: C.base }}>{t("game.gameOver")}</div>
        <p style={{ fontSize: 22, color: C.muted }}>{t("game.winner", { username: gameOver.username, score: gameOver.score })}</p>
        <button onClick={() => navigate("/")} style={{ background: C.accent, color: C.base, borderRadius: 14, padding: "16px 40px", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}>
          {t("game.backToLobby")}
        </button>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if( !gameState ){
    return (
      <div style={{ minHeight: "100vh", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.body, color: C.muted }}>
        {t("game.loading", "Cargando partida...")}
      </div>
    );
  }

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {
              isJudge 
              ? <span style={{ background: C.accent, color: C.base, borderRadius: 999, padding: "3px 12px", fontFamily: F.display, fontWeight: 700, fontSize: 12 }}>
                  { t("game.youAreJudge", "Eres el juez") }
                </span>
              : <span style={{ fontFamily: F.body, fontSize: 13, color: "#9AA3AB" }}>
                  { t("room.judge") }: <strong style={{ color: "#fff" }}>{gameState.judge?.username}</strong>
                </span>
            }
            <span style={{ width: 8, height: 8, borderRadius: 999, background: C.accent, display: "inline-block" }} />
            <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, color: "#9AA3AB" }}>{ gameState.players.length }{" "}{t("room.players") }</span>
            RELOJ
          </div>
        </div>
      </nav>


      {/* ── SCOREBOARD ── */}
      <div style={{ padding: "50px 32px" }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>
          {t("game.scoreboard", "MARCADOR")}
          {revealedCards && !roundResult && (
            <span style={{ marginLeft: 12, color: C.muted, fontWeight: 500 }}>
              · {playedCount} {t("game.cardsOnTable", "cartas sobre la mesa")}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {gameState.players.map((p) => {
            const isMe = p.userId === myId;
            const isJ = p.userId === gameState.judge?.userId;
            const played = revealedCards?.some((c) => c.userId === p.userId) || (isMe && hasPlayed);
            return (
              <div key={p.userId} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: isMe ? `color-mix(in srgb, ${C.accent} 12%, #fff)` : C.surface,
                border: `1.5px solid ${isMe ? C.accent : C.border}`,
                borderRadius: 999, padding: "5px 12px 5px 5px",
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: isMe ? C.accent : C.base, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 12, color: isMe ? C.base : "#fff" }}>
                  {p.username[0].toUpperCase()}
                </div>
                <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.base }}>
                  {p.username}{isMe ? ` · ${t("room.you")}` : ""}
                </span>
                {isJ && (
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 10, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, padding: "1px 6px" }}>
                    {t("room.judge", "JUEZ").toUpperCase()}
                  </span>
                )}
                <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 15, color: isMe ? C.accentDeep : C.base, minWidth: 14, textAlign: "center" }}>
                  {p.score}
                </span>
                {played && !isJ && (
                  <span style={{ width: 18, height: 18, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.base }}>✓</span>
                )}
                {!played && !isJ && !isMe && (
                  <span style={{ width: 18, height: 18, borderRadius: 999, border: `1.5px solid ${C.border}`, display: "inline-block" }} />
                )}
              </div>
            );
          })}
          <div style={{ marginLeft: "auto", fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.faint, alignSelf: "center" }}>
            {t("game.goal", "Meta")} · <strong>{gameState.pointsToWin}</strong> {t("game.points", "puntos")}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row px-10 2xl:px-0">

        {/* Round result banner */}
        {
          roundResult &&
          <div style={{ background: `color-mix(in srgb, ${C.accent} 12%, #fff)`, border: `1.5px solid color-mix(in srgb, ${C.accent} 40%, transparent)`, borderRadius: 16, padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.base }}>
                {t("game.roundWinner", { username: roundResult.winner.username })}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 2 }}>
                "{roundResult.winningCard.text}"
              </div>
            </div>
          </div>
        }

        {
          isJudge
        ?
          /* ── JUDGE VIEW ── */
          <div>
            {
              gameState.currentBlackCard &&
              <BlackCard question={ gameState.currentBlackCard.text } />
            }
            {
              revealedCards && !roundResult 
              ? 
                <div>
                  <p className={ styles.judge_desc } style={{ color: C.muted }}>{ t("game.pickWinner") } · {revealedCards.length}{" "}{ t("game.answers") }</p>
                  <div className={ styles.judge_grid }>
                  {
                    revealedCards.map(({ userId, card }) => (
                      <div
                        key={ userId }
                        onClick={ () => handlePickWinner(userId) }
                        className={ styles.judge_cards }
                        style={{
                          background: selectedWinner === userId ? `color-mix(in srgb, ${C.accent} 12%, #fff)` : "#fff",
                          border: `1.5px solid ${ selectedWinner === userId ? C.accent : C.border }` 
                        }}
                      >
                        <div className={ styles.judge_cards_title } style={{ color: C.base }}>{ card.text }</div>
                      </div>
                    ))
                  }
                  </div>
                </div>
            : !roundResult 
              ? <p className={ styles.judge_desc } style={{ color: C.muted }}>{ t("game.waitingForPlayers") }{" "}({playedCount} / {totalNeeded})</p>
              : null
            }
          </div>
        :
          /* ── PLAYER VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
            {/* LEFT: BLACK CARD */}
            <div>
              {
                gameState.currentBlackCard &&
                <BlackCard question={ gameState.currentBlackCard.text } />
              }
              {
                hasPlayed && !revealedCards &&
                <p className={ styles.judge_desc } style={{ color: C.muted }}>{ t("game.played", { count: playedCount, total: totalNeeded })}</p>
              }
              {
                revealedCards && !roundResult &&
                <p className={ styles.judge_desc } style={{ color: C.muted }}>{ t("game.waitingForJudge") }</p>
              }
            </div>
            {/* RIGHT: HAND */}
            <div>
              <div className={ styles.player_pick_answer } style={{ color: C.faint }}>{ t("game.pickCard") }</div>
              <div className={ styles.player_card_container }>
                {
                  hand.map((card) => {
                    const isSelected = selectedCard === card.id;
                    return (
                      <div
                        key={ card.id }
                        onClick={ () => !hasPlayed && handlePlayCard(card.id) }
                        className={ styles.player_card }
                        style={{ 
                          border: `1.5px solid ${ isSelected ? C.accent : C.border }`,
                          cursor: hasPlayed ? "default" : "pointer",
                          opacity: hasPlayed && !isSelected ? 0.5 : 1,
                          boxShadow: isSelected ? `0 4px 16px -6px color-mix(in srgb, ${ C.accent } 40%, transparent)` : "none"
                        }}
                      >
                      <span className={ styles.player_card_title } style={{ color: C.base }}>{ card.text }</span>
                      {
                        isSelected &&
                        <span className={ styles.player_card_check } style={{ background: C.accent, color: C.base }}>✓</span>
                      }
                    </div>
                  );
                })}
              </div>
              {
                !hasPlayed &&
                <Button
                  bgColor={ selectedCard ? C.accent : "#ccc" }
                  textColor={ C.base }
                  onClick={ handleSendCard }
                  disabled={ !selectedCard }
                  style={{
                    boxShadow: selectedCard ? `0 10px 25px -10px color-mix(in srgb, ${C.accent} 50%, transparent)` : "none",
                    marginBottom: 50,
                    marginTop: !hasPlayed ? -25 : 25,
                    width: "100%"
                  }}
                >
                  { t("game.sendCard") }
                </Button>
              }
            </div>
          </div>
        }
      </div>
      <Footer />
    </div>
  );
};