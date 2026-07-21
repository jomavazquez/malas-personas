import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, useToast } from "../context";
import { C, connectSocket } from "../lib";
import { Footer, GameNav, GameOver, JudgeView, LoadingRoom, PlayerView, Scoreboard } from "../components";
import type { GameState, PlayedCard, Card } from "../types";

export const GamePage = () => {

  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
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
  const [ playedCards, setPlayedCards ] = useState<{ id: string; text: string }[]>([]);
  const [ winnerCardId, setWinnerCardId ] = useState<string | null>(null);
  const [ showingResult, setShowingResult ] = useState(false);

  const clock = 60;
  const [ timer, setTimer ] = useState(clock);

  const isJudge = gameState?.judge?.userId === myId;
  const isSpectator = gameState?.players.find((p) => p.userId === myId)?.isSpectator ?? false;

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

  const totalNeeded = gameState?.players.filter((p) => !p.isJudge && !p.isSpectator).length ?? 1;

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
      setShowingResult(false);
      setGameState((s) => s ? { ...s, currentBlackCard: blackCard, judge: judge ?? s.judge } : s);
      setHasPlayed(false);
      setRevealedCards(null);
      setRoundResult(null);
      setPlayedCount(0);
      setSelectedWinner(null);
      setPlayedCards([]);
      setWinnerCardId(null);
      setTimer(clock);
      // selectedCard se limpia cuando llegan nuevas cartas (hand:update)
      if( judge && judge.userId === myId ) showToast(t("game.youAreJudge"), "info");
    });

    socket.on("round:cardPlayed", ({ playedCount: c, card }: { playedCount: number; card?: { id: string; text: string } }) => {
      setPlayedCount(c);
      if( card ) setPlayedCards((prev) => [...prev, card]);
    });
    socket.on("round:reveal", ({ cards }: { cards: PlayedCard[] }) => setRevealedCards(cards));

    socket.on("round:winner", ({ winner, winningCard, scores }: { winner: { userId: string; username: string; score: number }; winningCard: Card; scores: GameState["players"] }) => {
      setRoundResult({ winner, winningCard });
      setWinnerCardId(winningCard.id);
      setShowingResult(true);
      setGameState((s) => s ? { ...s, players: scores } : s);
      if( winner.userId === myId ){
        showToast(t("game.youWonRound"), "success");
      }else{
        showToast(t("game.roundWinner", { username: winner.username }), "success");
      }
    });

    socket.on("game:over", ({ winner }: { winner: { userId: string; username: string; score: number } }) => setGameOver(winner));

    socket.on("room:playerLeft", ({ userId, username }: { userId: string; username: string }) => {
      setGameState((s) => s ? { ...s, players: s.players.filter((p) => p.userId !== userId) } : s);
      showToast(t("game.playerLeft", { username }), "info");
    });

    socket.on("room:playerJoined", ({ userId, username, isGuest: g, isSpectator: spectator }: { userId: string; username: string; isGuest: boolean; isSpectator: boolean }) => {
      setGameState((s) => s ? {
        ...s,
        players: s.players.some((p) => p.userId === userId)
          ? s.players
          : [...s.players, { userId, username, score: 0, isGuest: g, isJudge: false, isSpectator: spectator }],
      } : s);
      showToast(t("game.playerJoinedGame", { username }), "info");
    });

    return () => {
      socket.off("hand:update");
      socket.off("round:new");
      socket.off("round:cardPlayed");
      socket.off("round:reveal");
      socket.off("round:winner");
      socket.off("game:over");
      socket.off("room:playerLeft");
      socket.off("room:playerJoined");
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
      if( res.error ){ showToast(res.error, "error"); return; }
      setHasPlayed(true);
    });
  };

  const handlePickWinner = ( winnerUserId: string ) => {
    if( roundResult ) return;
    setSelectedWinner(winnerUserId);
    const socket = connectSocket();
    socket.emit("round:pickWinner", { roomCode: code, winnerUserId }, (res: { error?: string }) => {
      if( res.error ){ showToast(res.error, "error"); setSelectedWinner(null); }
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
      <GameNav
        isJudge={ isJudge }
        judgeUsername={ gameState.judge?.username }
        playerCount={ gameState.players.length }
        timer={ timer }
        clock={ clock }
      />
      {/* ── MAIN CONTENT ── */}
      <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 mt-10">
        {
          isJudge
          ? <JudgeView
              blackCard={ gameState.currentBlackCard }
              revealedCards={ revealedCards }
              roundResult={ roundResult }
              showingResult={ showingResult }
              winnerCardId={ winnerCardId }
              selectedWinner={ selectedWinner }
              playedCount={ playedCount }
              totalNeeded={ totalNeeded }
              playedCards={ playedCards }
              onPickWinner={ handlePickWinner }
            />
          : <PlayerView
              blackCard={ gameState.currentBlackCard }
              playedCount={ playedCount }
              totalNeeded={ totalNeeded }
              roundResult={ roundResult }
              showingResult={ showingResult }
              revealedCards={ revealedCards }
              hasPlayed={ hasPlayed }
              playedCards={ playedCards }
              winnerCardId={ winnerCardId }
              myId={ myId }
              selectedCard={ selectedCard }
              hand={ hand }
              isSpectator={ isSpectator }
              onPlayCard={ handlePlayCard }
              onSendCard={ handleSendCard }
            />
        }
        {/* ── SCOREBOARD ── */}
        <Scoreboard
          players={ gameState.players }
          judgeId={ gameState.judge?.userId }
          myId={ myId }
          pointsToWin={ gameState.pointsToWin }
          playedCount={ playedCount }
          showCardsOnTable={ !!revealedCards && !roundResult }
        />
      </div>
      <Footer />
    </div>
  );
};