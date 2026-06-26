import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { C } from "../../lib";
import { Avatar, Button, Footer, Logo, TopMenu } from "../../components";
import type { Player } from "../../types";
import styles from "./GameOver.module.css";

interface GameOverProps {
    winner: { userId: string; username: string; score: number };
    players: Player[];
}

export const GameOver = ({ winner, players }: GameOverProps) => {
    
    const { t } = useTranslation();
    const navigate = useNavigate();

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    useEffect(() => {
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = [C.accent, "#000", "#ffffff"];
        const frame = () => {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
            if( Date.now() < end ) requestAnimationFrame(frame);
        };
        frame();
    }, []);

    return (
        <div style={{ background: C.surface, position: "relative" }}>
            <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
                <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
                    <Logo />
                    <TopMenu />
                </div>
            </nav>
            <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 mt-10" style={{ maxWidth: 500 }}>
                <div className={ styles.go_pre } style={{ color: C.base }}>{ t("game.gameOver") }</div>
                <h1 className="heading_1" style={{ color: C.base, textAlign: "center" }}>{ t("game.winsTitle", { username: winner.username }) }{" "}🏆</h1>
                <div className={ styles.go_container }>
                    {
                        sortedPlayers.map((p, i) => {
                            const isWinner = p.userId === winner.userId;
                            return (
                                <div
                                    key={ p.userId }
                                    className={ styles.go_player }
                                    style={{ background: isWinner ? C.accent : "#fff" }}
                                >
                                    <span className={ styles.go_number } style={{ color: isWinner ? C.base : "#9AA3AB" }}>{ i + 1 }</span>
                                    <div className={ styles.go_avatar_number }>
                                        <Avatar user={ p.username } bgColor={ C.base } textColor="#fff" showLabel />
                                        <span className={ styles.go_score } style={{ color: isWinner ? C.base : "#fff" }}>{ p.score }</span>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
                <div className={ styles.go_action }>
                    <Button onClick={ () => navigate("/") }>{ t("game.leaveRoom") }</Button>
                </div>
            </div>
            <Footer />
        </div>
    );
};