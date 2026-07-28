import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, useToast } from "../context";
import { C, connectSocket } from "../lib";
import { Footer, GameOver, LoadingRoom, VomNav, VomSidebarScoreboard, WriteStatementsView, AwaitingStatementsView, VoteView, ProtagonistWaitingView, RevealView } from "../components";
import type { VomPhase, VomPlayer, VomStatement, VomVote } from "../types";

interface VomAckState {
  hostId: string;
  status: "waiting" | "playing" | "finished";
  pointsToWin: number;
  maxPlayers: number;
  roundNumber: number;
  phase: "writing" | "voting" | "reveal" | null;
  protagonistUserId: string | null;
  isProtagonist: boolean;
  statements: VomStatement[] | null;
  myVote: string | null;
  voteDeadlineAt: number | null;
  players: VomPlayer[];
}

export const Game_V_O_M_Page = () => {

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

  const [ phase, setPhase ] = useState<VomPhase>({ kind: "loading" });
  const [ players, setPlayers ] = useState<VomPlayer[]>([]);
  const [ protagonistUserId, setProtagonistUserId ] = useState<string | null>(null);
  const [ roundNumber, setRoundNumber ] = useState(1);
  const [ pointsToWin, setPointsToWin ] = useState(5);
  const [ myStatements, setMyStatements ] = useState<VomStatement[] | null>(null);

  const protagonist = players.find((p) => p.userId === protagonistUserId);
  const protagonistName = protagonist?.username ?? "";

  useEffect(() => {
    if( !code || !myId || !myName ) return;
    const socket = connectSocket();

    socket.emit("room:join", { roomCode: code, userId: myId, username: myName, isGuest: !user }, (res: { error?: string; state?: VomAckState }) => {
      if( res.error ){ navigate("/"); return; }
      const state = res.state!;
      setPlayers(state.players);
      setProtagonistUserId(state.protagonistUserId);
      setRoundNumber(state.roundNumber);
      setPointsToWin(state.pointsToWin);

      if( state.phase === "writing" ){
        setPhase({ kind: "writing", isProtagonist: state.isProtagonist });
      }else if( state.phase === "voting" && state.statements ){
        if( state.isProtagonist ) setMyStatements(state.statements);
        setPhase({ kind: "voting", statements: state.statements, voteDeadlineAt: state.voteDeadlineAt ?? Date.now(), isProtagonist: state.isProtagonist, myVote: state.myVote });
      }
      // Reconnect just during a reveal (short window of ~3s) — player waits to the next round (coming inmediatly)
    });

    socket.on("vom:playerStatus", ({ players: p, protagonistUserId: protId }: { players: VomPlayer[]; protagonistUserId: string | null }) => {
      setPlayers(p);
      setProtagonistUserId(protId);
    });

    socket.on("vom:round:new", ({ roundNumber: r, protagonist: prot }: { roundNumber: number; protagonist: { userId: string; username: string } }) => {
      setRoundNumber(r);
      setProtagonistUserId(prot.userId);
      setMyStatements(null);
      setPhase({ kind: "writing", isProtagonist: prot.userId === myId });
      if( prot.userId === myId ) showToast(t("vom.youAreInFocus"), "info");
    });

    socket.on("vom:round:voting", ({ statements, voteDeadlineAt }: { statements: VomStatement[]; voteDeadlineAt: number }) => {
      setPhase((prev) => ({
        kind: "voting",
        statements,
        voteDeadlineAt,
        isProtagonist: prev.kind === "writing" ? prev.isProtagonist : false,
        myVote: null,
      }));
    });

    socket.on("vom:round:reveal", ({ statements, votes, fooledCount }: { statements: VomStatement[]; votes: VomVote[]; fooledCount: number }) => {
      setPhase({ kind: "reveal", statements, votes, fooledCount });
    });

    socket.on("vom:round:aborted", () => {
      showToast(t("vom.protagonistLeft"), "info");
    });

    socket.on("vom:game:over", ({ winner }: { winner: { userId: string; username: string; score: number } }) => {
      setPhase({ kind: "gameOver", winner });
    });

    socket.on("room:playerLeft", ({ userId, username }: { userId: string; username: string }) => {
      setPlayers((prev) => prev.filter((p) => p.userId !== userId));
      showToast(t("game.playerLeft", { username }), "info");
    });

    socket.on("room:playerJoined", ({ userId, username, isGuest: g, isSpectator: spectator }: { userId: string; username: string; isGuest: boolean; isSpectator: boolean }) => {
      setPlayers((prev) => prev.some((p) => p.userId === userId) ? prev : [ ...prev, { userId, username, score: 0, isGuest: g, isSpectator: spectator, status: "spectator" } ]);
      showToast(t("game.playerJoinedGame", { username }), "info");
    });

    return () => {
      socket.off("vom:playerStatus");
      socket.off("vom:round:new");
      socket.off("vom:round:voting");
      socket.off("vom:round:reveal");
      socket.off("vom:round:aborted");
      socket.off("vom:game:over");
      socket.off("room:playerLeft");
      socket.off("room:playerJoined");
    };
  }, [ myId, myName, code, navigate ]);

  const handleSubmitStatements = ( statements: { text: string; isLie: boolean }[] ) => {
    const socket = connectSocket();
    socket.emit("vom:statements:submit", { roomCode: code, statements }, (res: { error?: string }) => {
      if( res.error ){ showToast(t(`errors.${res.error}`, res.error), "error"); return; }
      setMyStatements(statements.map((s, i) => ({ id: `s${i}`, text: s.text, isLie: s.isLie })));
    });
  };

  const handleCastVote = ( statementId: string ) => {
    if( phase.kind !== "voting" || phase.myVote ) return;
    const socket = connectSocket();
    socket.emit("vom:vote:cast", { roomCode: code, statementId }, (res: { error?: string }) => {
      if( res.error ){ showToast(t(`errors.${res.error}`, res.error), "error"); return; }
      setPhase((prev) => prev.kind === "voting" ? { ...prev, myVote: statementId } : prev);
    });
  };

  if( phase.kind === "gameOver" ){
    return <GameOver winner={ phase.winner } players={ players.map((p) => ({ ...p, isJudge: false })) } />;
  }

  if( phase.kind === "loading" ){
    return <LoadingRoom />;
  }

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <VomNav
        roundNumber={ roundNumber }
        playerCount={ players.length }
        voteDeadlineAt={ phase.kind === "voting" ? phase.voteDeadlineAt : null }
      />
      <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 my-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div>
          {
            phase.kind === "writing" && (
              phase.isProtagonist
              ? <WriteStatementsView onSubmit={ handleSubmitStatements } />
              : <AwaitingStatementsView protagonistName={ protagonistName } />
            )
          }
          {
            phase.kind === "voting" && (
              phase.isProtagonist
              ? <ProtagonistWaitingView statements={ myStatements ?? phase.statements } players={ players } protagonistUserId={ protagonistUserId ?? "" } />
              : <VoteView statements={ phase.statements } myVote={ phase.myVote } protagonistName={ protagonistName } onVote={ handleCastVote } />
            )
          }
          {
            phase.kind === "reveal" &&
            <RevealView
              statements={ phase.statements }
              votes={ phase.votes }
              fooledCount={ phase.fooledCount }
              protagonistUserId={ protagonistUserId ?? "" }
              protagonistName={ protagonistName }
              myId={ myId }
            />
          }
        </div>
        <VomSidebarScoreboard players={ players } protagonistUserId={ protagonistUserId } myId={ myId } pointsToWin={ pointsToWin } />
      </div>
      <Footer />
    </div>
  );
};