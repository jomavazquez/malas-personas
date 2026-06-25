import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useJoinModal } from "../../context";
import { Badge, Button, Footer, Logo, TopMenu, UnderlineLink } from "../../components";
import { C, F } from "../../lib";
import styles from "./RoomNotFound.module.css";

interface RoomNotFoundProps {
    code?: string;
    error: string;
}

export const RoomNotFound = ({ code, error }: RoomNotFoundProps) => {
    
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { openJoinModal } = useJoinModal();

    const isNotFound = error.includes("encontrada") || error.includes("not found") || error.includes("inactiva") || error.includes("inactive");

    return (
        <div style={{ background: C.surface, position: "relative" }}>
            <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
                <div className="max-w-360 mx-auto w-full flex items-center justify-between">
                    <Logo />
                    <TopMenu />
                </div>
            </nav>        
            <div className={ styles.container }>
                <div className={ styles.cards_containter }>
                    <div className={ `${ styles.card } ${ styles.card_black }` } />
                    <div className={ `${ styles.card } ${ styles.card_white }` }><span style={{ fontFamily: F.display, fontSize: 50, color: "#E5534B" }}>?</span></div>
                </div>
                <Badge color="#E5534B">{ isNotFound ? t("errors.ROOM_NOT_FOUND") : t("errors.ERROR") }</Badge>
                <h2 className={`heading_1 ${ styles.title }`} style={{ color: C.base }}>{ isNotFound ? t("errors.notFoundTitle") : t(`errors.${error}`, error) }</h2>
                {
                    isNotFound &&
                    <>
                        <p className={ styles.desc } style={{ color: C.base }}>{ t("errors.theCode") }{" "}<strong>{ code }</strong>{" "}{ t("errors.theCode2") }</p>
                        <p className={ styles.sub } style={{ color: C.faint }}>{ t("errors.theCodeSub") }</p>
                    </>
                }
                <div className={ styles.actions }>
                    <Button onClick={ () => navigate("/lobby") }>{ t("cta.button") }</Button>
                    <UnderlineLink onClick={ openJoinModal }>{ t("room.tryAgain") }</UnderlineLink>
                </div>
            </div>
            <Footer />
        </div>
    );
};