import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { getOrCreateGuestId } from "../../../lib/guest";
import { C } from "../../../lib";
import styles from "./JoinModal.module.css";

interface JoinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinModal = ({ isOpen, onClose }: JoinModalProps) => {
    
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ joinCode, setJoinCode ] = useState("");
    const [ name, setName ] = useState(user?.username ?? "");

    const canJoin = joinCode.length === 6 && name.trim().length > 0;

    const handleJoin = () => {
        if( !canJoin ) return;
        const guestId = user ? user.id : getOrCreateGuestId();
        navigate(`/room/${joinCode.trim().toUpperCase()}`, {
            state: { guestId, guestName: name.trim() },
        });
        onClose();
    };

    const handleClose = () => {
        setJoinCode("");
        setName(user?.username ?? "");
        onClose();
    };

    useEffect(() => {
        if( user?.username ) setName(user.username);
    }, [ user?.username ]);

    if( !isOpen ) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: "rgba(0,0,0,0.5)" }} onClick={ handleClose }>
            <div className={ styles.box } onClick={ (e) => e.stopPropagation() }>
                <div className={ styles.box_title } style={{ color: C.base }}>{ t("lobby.joinRoom") }</div>
                <input
                    className="input_code"
                    style={{ border: `2px solid ${C.border}`, color: C.base }}
                    placeholder="XXXXXX"
                    value={ joinCode }
                    onChange={ (e) => setJoinCode(e.target.value.toUpperCase()) }
                    maxLength={ 6 }
                    autoFocus
                    onKeyDown={ (e) => e.key === "Enter" && handleJoin() }
                />
                <div style={{ marginBottom: 15 }}>
                    <label className="form_label" style={{ color: C.muted }}>{ t("auth.username") }</label>
                    <input
                        className="input"
                        style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                        placeholder="Marina"
                        value={ name }
                        onChange={ (e) => setName(e.target.value) }
                        maxLength={ 20 }
                        readOnly={ !!user }
                        onKeyDown={ (e) => e.key === "Enter" && handleJoin() }
                    />
                </div>
                <button
                    className="box_btn"
                    onClick={ handleJoin }
                    disabled={ !canJoin }
                    style={{ background: !canJoin ? "#ccc" : C.accent, color: C.base, cursor: !canJoin ? "not-allowed" : "pointer" }}
                >
                    { t("lobby.join") }
                </button>
            </div>
        </div>
    );
};