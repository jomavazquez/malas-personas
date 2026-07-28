import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { LoadingRoom, RoomNotFound } from "../components";
import { api } from "../lib";
import type { GameType } from "../types";

const Game_M_P_Page = lazy(() => import("./Game_M_P_Page").then((m) => ({ default: m.Game_M_P_Page })));
const Game_V_O_M_Page = lazy(() => import("./Game_V_O_M_Page").then((m) => ({ default: m.Game_V_O_M_Page })));

export const GameRouterPage = () => {

  const { code } = useParams<{ code: string }>();
  const [ gameType, setGameType ] = useState<GameType | null>(null);
  const [ error, setError ] = useState("");

  useEffect(() => {
    if( !code ) return;
    api.get<{ room: { gameType: GameType } }>(`/rooms/${code}`)
      .then((data) => setGameType(data.room.gameType))
      .catch((err: Error) => setError(err.message || "ROOM_NOT_FOUND"));
  }, [ code ]);

  if( error ) return <RoomNotFound code={ code } error={ error } />;
  if( !gameType ) return <LoadingRoom />;

  return (
    <Suspense fallback={ <LoadingRoom /> }>
      { 
        gameType === "V_O_M" 
        ? <Game_V_O_M_Page /> 
        : <Game_M_P_Page />
      }
    </Suspense>
  );
};