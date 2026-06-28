import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { C, connectSocket } from "../lib";
import { Avatar, BlackCard, Button, Footer, Logo, GameOver, LoadingRoom } from "../components";
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

  const [ gameState, setGameState ] = useState<GameState | null>(null);
  const [ hand, setHand ] = useState<Card[]>([]);
  const [ selectedCard, setSelectedCard ] = useState<string | null>(null);
  const [ hasPlayed, setHasPlayed ] = useState(false);
  const [ revealedCards, setRevealedCards ] = useState<PlayedCard[] | null>(null);
  const [ roundResult, setRoundResult ] = useState<{ winner: { userId: string; username: string; score: number }; winningCard: Card } | null>(null);
  const [ gameOver, setGameOver ] = useState<{ userId: string; username: string; score: number } | null>(null);
  const [ playedCount, setPlayedCount ] = useState(0);
  const [ selectedWinner, setSelectedWinner ] = useState<string | null>(null);
  
  const clock = 60;
  const [timer, setTimer] = useState(clock);

  const isJudge = gameState?.judge?.userId === myId;

  // Timer
  useEffect(() => {
    setTimer(clock);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if(prev <= 1 ){
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ gameState?.currentBlackCard?.id] );

  // Auto-send on timeout
  useEffect(() => {
    if( timer !== 0 || hasPlayed || isJudge || !gameState ) return;
    const cardToPlay = selectedCard ?? hand[Math.floor(Math.random() * hand.length)]?.id;
    if( !cardToPlay ) return;
    const socket = connectSocket();
    socket.emit("round:playCard", { roomCode: code, cardId: cardToPlay }, (res: { error?: string }) => {
      if( !res.error ){
        setSelectedCard(cardToPlay);
        setHasPlayed(true);
      }
    });
  }, [ timer ]);
  
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
      setTimer(clock);
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

  if( gameOver ){
    return (
      <GameOver winner={ gameOver } players={ gameState?.players ?? [] } />
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if( !gameState ){
    return <LoadingRoom />;
  }

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {
              isJudge 
              ? <span className={ styles.you_judge } style={{ background: C.accent, color: C.base }}>{ t("game.youAreJudge") }</span>
              : <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>
                  { t("room.judge") }:{" "}<strong style={{ color: C.faint }}>{ gameState.judge?.username }</strong>
                </span>
            }
            <span className={ styles.dot } style={{ background: C.accent }} />
            <span className="player_pick_answer" style={{ color: C.faint, marginBottom: 0 }}>{ gameState.players.length }{" "}{t("room.players") }</span>
            <span className={ styles.dot } style={{ background: C.accent }} />
            <div className={ styles.clock } style={{ color: timer <= 10 ? "#E5534B" : C.base }}>
              <span className={ styles.clock_dot } style={{ background: timer <= 10 ? "#E5534B" : C.accent }} />
              { String(Math.floor(timer / clock)).padStart(1, "0")}:{String(timer % clock).padStart(2, "0") }
            </div>
          </div>
        </div>
      </nav>
      {/* ── MAIN CONTENT ── */}
      <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 mt-10">
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
                  <p className={ `my-5 ${ styles.judge_desc }` } style={{ color: C.muted }}>{ t("game.pickWinner") } · {revealedCards.length}{" "}{ t("game.answers") }</p>
                  <div className={ `mb-10 ${ styles.judge_grid }` }>
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
              ? <p className={ `my-5 mb-10 ${ styles.judge_desc }` } style={{ color: C.muted }}>{ t("game.waitingForPlayers") }{" "}({playedCount} / {totalNeeded})</p>
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
                <p className={ `my-5 ${ styles.judge_desc }` } style={{ color: C.muted }}>{ t("game.played", { count: playedCount, total: totalNeeded })}</p>
              }
              {
                revealedCards && !roundResult &&
                <p className={ `mt-5 ${ styles.judge_desc }` } style={{ color: C.muted }}>{ t("game.waitingForJudge") }</p>
              }
            </div>
            {/* RIGHT: HAND */}
            <div>
              <div className="player_pick_answer" style={{ color: C.faint }}>{ t("game.pickCard") }</div>
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
        {/* ── SCOREBOARD ── */}
        <div className="pb-10">
          <div className="flex">
            <div className="player_pick_answer" style={{ color: C.faint }}>
              { t("game.score") }
              {
                revealedCards && !roundResult &&
                <span style={{ color: C.faint, fontWeight: 500 }}>{" "}·{" "}{ playedCount }{" "}{ t("game.cardsOnTable") }</span>
              }
            </div>
            <div className="player_pick_answer" style={{ marginLeft: "auto", color: C.faint, alignSelf: "center" }}>
              { t("game.goal") }{" "}·{" "}<strong>{ gameState.pointsToWin }</strong>{" "}{t("myroom.points") }
            </div>
          </div>
          <div className={ styles.score_grid }>
            {
              gameState.players.map((p) => {
                const isMe = p.userId === myId;
                const isJ = p.userId === gameState.judge?.userId;
                return (
                  <div 
                    key={ p.userId } 
                    className={ styles.score_player }
                    style={{
                      background: isMe ? `color-mix(in srgb, ${C.accent} 15%, #fff)` : "#fff",
                      border: `1.5px solid ${ isMe ? C.accent : C.border }`,
                    }}
                  >
                    <Avatar size={ 28 } user={ p.username } showLabel />
                    {
                      isJ &&
                      <span className={ styles.score_judge_label }>{ t("game.judgeLabel").toUpperCase() }</span>
                    }
                    <span className={ styles.score } style={{ color: C.base }}>{ p.score }</span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};