import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { C, F, connectSocket } from "../lib";
import { Footer, Logo } from "../components";
import type { GameState, PlayedCard, Card } from "../types";

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

  const isJudge = gameState?.judge?.userId === myId;

  useEffect(() => {
    if (!code || !myId || !myName) return;
    const socket = connectSocket();

    socket.emit("room:join", { roomCode: code, userId: myId, username: myName, isGuest: !user }, (res: { error?: string; state?: GameState }) => {
      if (res.error) { navigate("/"); return; }
      setGameState(res.state!);
      setHand(res.state!.hand ?? []);
    });

    socket.on("hand:update", ({ hand: h }: { hand: Card[] }) => setHand(h));

    socket.on("round:new", ({ blackCard, judge }: { blackCard: Card; judge?: GameState["judge"] }) => {
      setGameState((s) => s ? { ...s, currentBlackCard: blackCard, judge: judge ?? s.judge } : s);
      setHasPlayed(false);
      setSelectedCard(null);
      setRevealedCards(null);
      setRoundResult(null);
      setPlayedCount(0);
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
  }, [myId, myName, code, navigate]);

  const handlePlayCard = (cardId: string) => {
    if (hasPlayed || isJudge) return;
    setSelectedCard(cardId);
    const socket = connectSocket();
    socket.emit("round:playCard", { roomCode: code, cardId }, (res: { error?: string }) => {
      if (res.error) { alert(res.error); return; }
      setHasPlayed(true);
    });
  };

  const handlePickWinner = (winnerUserId: string) => {
    const socket = connectSocket();
    socket.emit("round:pickWinner", { roomCode: code, winnerUserId }, (res: { error?: string }) => {
      if (res.error) alert(res.error);
    });
  };

  const totalNeeded = (gameState?.players?.length ?? 1) - 1;

  if (gameOver) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: F.body }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 56, letterSpacing: "-0.04em", color: C.base }}>{t("game.gameOver")}</div>
        <p style={{ fontSize: 22, color: C.muted }}>{t("game.winner", { username: gameOver.username, score: gameOver.score })}</p>
        <button onClick={() => navigate("/")} style={{ background: C.accent, color: C.base, borderRadius: 14, padding: "16px 40px", fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}>
          {t("game.backToLobby")}
        </button>
      </div>
    );
  }

  if (!gameState) {
    return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.body, color: C.muted }}>Cargando partida...</div>;
  }

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
        </div>
      </nav>      

      {/* Header */}
      <div style={{ background: C.base, padding: "14px 52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 28 }}>
          {gameState.players.map((p) => (
            <div key={p.userId} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: p.userId === myId ? C.accent : "#fff" }}>{p.score}</div>
              <div style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>{p.username}{p.isJudge ? " ⚖️" : ""}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.faint }}>
          {t("game.pointsToWin")}: {gameState.pointsToWin}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 44px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Judge badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#E5534B", color: "#fff", borderRadius: 999, padding: "4px 12px", fontFamily: F.display, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("room.judge")}
          </span>
          <span style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>
            {isJudge ? t("game.youAreJudge") : gameState.judge?.username}
          </span>
        </div>

        {/* Black card */}
        {gameState.currentBlackCard && (
          <div style={{ background: C.base, borderRadius: 20, padding: "28px 28px", maxWidth: 480, boxShadow: "0 30px 56px -22px rgba(47,52,58,.5)" }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1.18, letterSpacing: "-0.02em" }}>
              {gameState.currentBlackCard.text.split("______").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span style={{ borderBottom: `3px solid ${C.accent}`, paddingBottom: 2, margin: "0 4px", display: "inline-block", width: 80 }} />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Round result */}
        {roundResult && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: `1px solid ${C.borderMid}` }}>
            <p style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.accentDeep, marginBottom: 12 }}>
              🏆 {t("game.roundWinner", { username: roundResult.winner.username })}
            </p>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 8 }}>{t("game.winningCard")}</p>
            <div style={{ background: C.surface, borderRadius: 16, padding: "16px 18px", maxWidth: 280, fontFamily: F.display, fontWeight: 700, fontSize: 15, color: C.base }}>
              {roundResult.winningCard.text}
            </div>
          </div>
        )}

        {/* Reveal — judge picks */}
        {revealedCards && !roundResult && isJudge && (
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{t("game.pickWinner")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {revealedCards.map(({ userId, username, card }) => (
                <div key={userId} onClick={() => handlePickWinner(userId)} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", width: 200, cursor: "pointer", border: `1.5px solid ${C.border}`, boxShadow: "0 8px 24px -8px rgba(47,52,58,.2)", transition: "transform 0.15s" }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: C.base, lineHeight: 1.2, marginBottom: 10 }}>{card.text}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.faint }}>— {username}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reveal — waiting */}
        {revealedCards && !roundResult && !isJudge && (
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{t("game.pickWinner")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {revealedCards.map(({ userId, card }) => (
                <div key={userId} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", width: 200, border: `1.5px solid ${C.border}`, fontFamily: F.display, fontWeight: 700, fontSize: 15, color: C.base, lineHeight: 1.2 }}>
                  {card.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting */}
        {!revealedCards && !isJudge && hasPlayed && (
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{t("game.played", { count: playedCount, total: totalNeeded })}</p>
        )}

        {/* Hand */}
        {!isJudge && !revealedCards && (
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{t("game.pickCard")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {hand.map((card) => (
                <div key={card.id} onClick={() => !hasPlayed && handlePlayCard(card.id)} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", width: 180, cursor: hasPlayed ? "default" : "pointer", border: selectedCard === card.id ? `2px solid ${C.accent}` : `1.5px solid ${C.border}`, opacity: hasPlayed && selectedCard !== card.id ? 0.4 : 1, boxShadow: "0 8px 24px -8px rgba(47,52,58,.2)", fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.base, lineHeight: 1.2 }}>
                  {card.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {isJudge && !revealedCards && (
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{t("game.waitingForPlayers")}</p>
        )}
      </div>
      <Footer />
    </div>
  );
};