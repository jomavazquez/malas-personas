import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { Badge, Button, Footer, Logo, TopMenuMyAccount } from "../components";
import { api, C } from "../lib";
import type { Room } from "../types";
import styles from "./MyRoomsPage.module.css";

type Filter = "all" | "active" | "finished";

export const MyRoomsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ rooms, setRooms ] = useState<Room[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ filter, setFilter ] = useState<Filter>("active");
  const [ search, setSearch ] = useState("");
  const [ copiedId, setCopiedId ] = useState<string | null>(null);
  const [ deleteCode, setDeleteCode ] = useState<string | null>(null);
  const [ deleteType, setDeleteType ] = useState<"close" | "delete">("close");

  const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ pillStyle, setPillStyle ] = useState({ left: 0, width: 0 });
  const filters: Filter[] = ["active", "finished", "all"];

  useLayoutEffect(() => {
    const idx = filters.indexOf(filter);
    const btn = filterRefs.current[idx];
    if( btn ) setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [ filter, i18n.language ]);

  useEffect(() => {
    api.get<{ rooms: Room[] }>("/rooms/my").then((data) => {
      setRooms(data.rooms);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (type: "close" | "delete", code: string) => {
    if( !code ) return;
    try{
      if( type === "delete" ){
        await api.delete(`/rooms/${code}`);
      }else{
        await api.patch(`/rooms/${code}/close`, {});
      }
      if( type === "delete" ){
        setRooms((prev) => prev.filter((r) => r.code !== code));
      }else{
        setRooms((prev) => prev.map((r) => r.code === code ? { ...r, isActive: false, status: "FINISHED" } : r));
      }
    }catch( err ){
    }finally{
      setDeleteCode(null);
    }
  };

  const filtered = rooms
    .filter((r) => {
      if( filter === "active" ) return r.isActive;
      if( filter === "finished" ) return !r.isActive;
      return true;
    })
    .filter((r) => {
      if( !search.trim() ) return true;
      const q = search.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    });

  const activeCount = rooms.filter((r) => r.isActive).length;

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      {/* DELETE MODAL */}
      {
        deleteCode &&
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6 modal_bg" onClick={() => setDeleteCode(null)}>
          <div className="modal_container" onClick={ (e) => e.stopPropagation() }>
            <div className="modal_title" style={{ color: C.base }}>{ deleteType === "delete" ? t("myroom.deleteRoom") : t("myroom.closeRoom") }</div>
            <p className="modal_body" style={{ color: C.muted }}>{ deleteType === "delete" ? t("myroom.deleteConfirm") : t("myroom.closeConfirm") }</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className={ `${ styles.btn } ${ styles.btn_cancel }`}
                onClick={ () => setDeleteCode(null) }
                style={{ border: `1.5px solid ${C.border}`, color: C.base }}
              >
                { t("myroom.cancel") }
              </button>
              <button 
                className={ `${ styles.btn } ${ styles.btn_delete }`} 
                onClick={ () => handleDelete(deleteType, deleteCode!) }
              >
                { deleteType === "delete" ? t("myroom.delete") : t("myroom.close") }
              </button>
            </div>
          </div>
        </div>
      }
      <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
          <Logo />
          <TopMenuMyAccount />
        </div>
      </nav>
      <div className="max-w-360 mx-auto px-4 md:px-14 2xl:px-0 py-6 md:py-16">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="heading_1" style={{ color: C.base }}>{ t("nav.myRooms") }</h1>
            <p className={ styles.text } style={{ color: C.muted }}>
              <strong>{ rooms.length }</strong> { t("myroom.saved") } · <strong>{ activeCount }</strong> { t("myroom.activeNow") }
            </p>
          </div>
          <Button bgColor={ C.accent } textColor="#000" onClick={() => navigate("/lobby")}>
            { t("nav.createRoom") } →
          </Button>
        </div>
        {/* FILTERS */}
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 mb-6">
          <div className={ styles.filter } style={{ border: `1px solid ${C.border}` }}>
            <div className={ styles.filter_active } style={{ left: pillStyle.left, width: pillStyle.width, background: C.base }} />
            {
              filters.map((f, i) => (
                <button
                  key={ f }
                  className={ styles.filter_btn }
                  ref={ (el) => { filterRefs.current[i] = el; } }
                  onClick={ () => setFilter(f) }
                  style={{ color: filter === f ? "#fff" : C.muted }}
                >
                  { t(`myroom.filter_${f}`) }
                </button>
              ))
            }
          </div>
          <div className="w-full md:w-68.75" style={{ position: "relative" }}>
            <span className={ styles.search_icon } style={{ color: C.faint }}>⌕</span>
            <input
              className={`input ${ styles.search }`}
              style={{ border: `1.5px solid ${C.border}`, color: C.base }}
              placeholder={ t("myroom.search") }
              value={ search }
              onChange={ (e) => setSearch(e.target.value) }
            />
          </div>
        </div>
        {/* TABLE */}
        <div className={ styles.table } style={{ border: `1.5px solid ${ C.borderMid }` }}>
          {/* HEADER ROW */}
          <div 
            className="hidden md:grid xl:grid-cols-[160px_1fr_200px_200px_60px_180px] lg:grid-cols-[160px_1fr_140px_150px_60px_180px] md:grid-cols-[120px_1fr_100px_120px_60px_125px]" 
            style={{ borderBottom: `1.5px solid ${C.border}`, padding: "10px 20px" }}
          >
            {
              ["lobby.code", "myroom.room", "room.players", "myroom.lastgame", "myroom.points", ""].map((k, i) => (
                <div
                  key={ i }
                  className={ `${styles.table_th} ${i >= 2 && i <= 4 ? "text-center" : ""}` }
                  style={{ color: C.faint }}
                >
                  { k ? t(k, k.split("_")[1]) : "" }
                </div>
              ))
            }
          </div>
          {
            loading 
            ? <div className={ styles.loading } style={{ color: C.muted }}>{ t("myroom.loading") }</div>
            : filtered.length === 0 
              ? <div className={ styles.loading } style={{ color: C.muted }}>{ t("myroom.empty") }</div>
              : filtered.map((room, i) => (
                <div 
                  key={ room.id }
                  className="grid grid-cols-1 xl:grid-cols-[160px_1fr_200px_200px_60px_180px] lg:grid-cols-[160px_1fr_140px_150px_60px_180px] md:grid-cols-[120px_1fr_100px_120px_60px_125px] gap-2 md:gap-0 items-center"
                  style={{ padding: "10px 20px", borderBottom: i < filtered.length - 1 ? `1.5px solid ${C.borderMid}` : "none" }}
                >
                  {/* CODE + COPY */}
                  <div className="justify-center md:justify-start" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div className={ styles.code_container } style={{ background: C.surface }}>
                      <span className={ styles.code } style={{ color: C.base }}>{ room.code }</span>
                    </div>
                    {
                      room.isActive && 
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(room.code);
                          setCopiedId(room.id);
                          setTimeout(() => setCopiedId(null), 750);
                        }}
                        className={`${ styles.btn } ${ styles.btn_copy } flex md:hidden lg:flex`}
                        style={{ border: `1.5px solid ${C.border}`, background: copiedId === room.id ? C.accent : "#fff", color: copiedId === room.id ? C.base : C.muted }}
                        title={ t("room.copyCode") }
                      >
                        { copiedId === room.id ? "✓" : "⧉" }
                      </button>
                    }
                  </div>
                  {/* ROOM INFO */}
                  <div>
                    <div className={`${styles.room_info} justify-center md:justify-start`}>
                      <span className={ styles.room_name } style={{ color: C.base }}>{ room.name ?? room.code }</span>
                      <Badge marginBottom={ 0 } dot={ room.isActive } color={ room.isActive ? undefined : C.muted }>{ t(room.isActive ? "myroom.active" : "myroom.finished") }</Badge>
                    </div>
                    <div className="text-center md:text-left mt-0.5 md:mt-2.5" style={{ color: C.faint, fontSize: 14 }}>
                      { room.deck?.language === "ES" ? "Español" : "English"} · { room.deck?.name === "All" ? t("myroom.forEveryone") : t("myroom.noFilter") }
                    </div>
                  </div>
                  <div className="text-center" style={{ fontSize: 15, color: C.muted }}>
                    { room.maxPlayers }<span className="inline md:hidden">{" "}{ t("room.players") }</span>
                  </div>
                  <div className="text-center" style={{ fontSize: 15, color: C.muted }}>
                    { room.createdAt ? new Date(room.createdAt).toLocaleDateString(i18n.language, { day: "numeric", month: "long" }) : "—" }
                  </div>
                  <div className="text-center" style={{ fontSize: 15, color: C.muted }}>
                    { room.pointsToWin }<span className="inline md:hidden">{" "}{ t("myroom.points") }</span>
                  </div>
                  <div className={ styles.table_actions }>
                    {
                      room.isActive &&
                      <Button
                        bgColor={ C.accent }
                        textColor="#000"
                        onClick={ () => navigate(`/room/${room.code}`, { state: { guestId: user!.id, guestName: user!.username } }) }
                        style={{ fontSize: 13, height: 35, padding: "10px", marginRight: 10 }}
                      >
                        { t("myroom.reopen") }
                      </Button>
                    }
                    <button
                      onClick={() => { setDeleteCode(room.code); setDeleteType(room.isActive ? "close" : "delete"); }}
                      className="btn_red"
                      style={{ borderRadius: 12, fontSize: 14 }}
                      title={ room.isActive ? t("myroom.close") : t("myroom.delete") }
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            }
        </div>
      </div>
      <Footer />
    </div>
  );
};