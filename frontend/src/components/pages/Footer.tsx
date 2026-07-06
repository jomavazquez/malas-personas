import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, useJoinModal } from "../../context";
import { Blob, Button, Logo } from "../../components";
import { useIsMobile } from "../../hooks";
import { C, F, goToSection, scrollToTop,  } from "../../lib";
import styles from "./Footer.module.css";

interface FooterPropLink {
    to?: string;
    onClick?: () => void;
    children: React.ReactNode
    target?: '_self' | '_blank';
}

export const Footer = () => {

    const { t } = useTranslation();
    const { user } = useAuth();
    const { openJoinModal } = useJoinModal();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [ showScrollUp, setShowScrollUp ] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollUp(window.scrollY > 300);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const FooterLink = ({ to, onClick, children, target = '_self' }: FooterPropLink ) => {
        if( onClick ){
            return (
                <button 
                    className={ styles.link } 
                    onClick={ onClick }
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9AA3AB")}
                >
                    { children }
                </button>
            );
        }
        return (
            <Link 
                to={ to ?? "#" } 
                className={ styles.link }
                target={ target }
                onMouseEnter={ (e) => (e.currentTarget.style.color = "#fff") }
                onMouseLeave={ (e) => (e.currentTarget.style.color = "#9AA3AB") }
            >
                { children }
            </Link>
        );
    };

    return (
        <footer style={{ background: "#000", position: "relative", overflow: "hidden" }}>
            <Blob 
                size={ isMobile ? 512 : 1024 } 
                color={ C.accent } 
                blur={ 80 } 
                style={{ 
                    top: isMobile ? -256 : "auto", 
                    bottom: isMobile ? "auto" : 550,
                    left: "50%", 
                    transform: "translateX(-50%)" 
                }} 
            />
            <div className="relative overflow-hidden px-8 md:px-14 py-16 text-center">
                <div className="relative">
                    <h2 className="text-[32px] md:text-[42px]" style={{ fontFamily: F.display, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", margin: "0 0 15px", lineHeight: 1.05 }}>
                        { t("cta.title") }
                    </h2>
                    <p className="text-base md:text-lg" style={{ fontFamily: F.body, fontWeight: 600, color: "#9AA3AB", marginBottom: 40 }}>
                        { t("cta.sub") }
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button to={ user ? "/lobby" : "/register"} bgColor={ C.accent } textColor="#000" size="md">
                            { t("nav.createRoom") } →
                        </Button>
                    </div>
                </div>
            </div>
            <div className="max-w-360 mx-auto w-full items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 px-8 md:px-14 py-12 md:py-16">
                    <div className="col-span-1">
                        <Logo color="#fff" fontSize={ 20 } />
                        <p className={ styles.tagline }>{ t("footer.tagline") }</p>
                        <div className="flex gap-2">
                            <a href="https://www.linkedin.com/in/jomavazquez/" target="_blank" className={ styles.social_link }>LinkedIn</a>
                        </div>
                    </div>
                    <div>
                        <div className={ styles.column_label }>{ t("footer.product") }</div>
                        <FooterLink onClick={ () => goToSection(navigate, "how") }>{ t("nav.howItWorks") }</FooterLink>
                        <FooterLink to={ user ? "/lobby" : "/register" }>{ t("nav.createRoom") }</FooterLink>
                        {
                            user &&
                            <>
                                <FooterLink to="/my-rooms">{ t("myroom.title") }</FooterLink>
                                <FooterLink to="/my-decks">{ t("mydecks.title") }</FooterLink>
                            </>
                        }
                        <FooterLink onClick={ openJoinModal }>{ t("footer.joinWithCode") }</FooterLink>
                    </div>
                    <div>
                        <div className={ styles.column_label }>{ t("footer.resources") }</div>
                        <FooterLink to="/help-center">{ t("footer.helpCenter") }</FooterLink>
                        <FooterLink to="/">{ t("footer.teamIdeas") }</FooterLink>
                        <FooterLink to="https://github.com/jomavazquez/malas-personas" target="_blank">{ t("footer.pOnGitHub") }</FooterLink>
                        <FooterLink to="/contact">{ t("footer.contact") }</FooterLink>
                    </div>
                    <div>
                        <div className={ styles.column_label }>{ t("footer.legal") }</div>
                        <FooterLink to="/legal-notice">{ t("footer.legalNotice") }</FooterLink>
                        <FooterLink to="/privacy-policy">{ t("footer.privacyPolicy") }</FooterLink>
                        <FooterLink to="/cookies-policy">{ t("footer.cookiePolicy") }</FooterLink>
                    </div>
                </div>
            </div>
            <div className="mx-8 md:mx-14" style={{ height: 0.5, background: "#222" }} />
            <div className={`px-8 md:px-14 text-center p-12 ${styles.copyright}`}>
                <span className={ styles.copyright }>&copy; { new Date().getFullYear() } Malas Personas</span> &#8212; <a href="https://www.josemariavazquez.com" target="_blank" rel="noopener noreferrer" className={`${styles.copyright} ${styles.author_link}`}>José María Vázquez</a>
            </div>
            <button 
                className={ styles.scroll_up }
                onClick={ scrollToTop }
                style={{
                    background: C.accent,
                    color: C.base,
                    opacity: showScrollUp ? 1 : 0,
                    pointerEvents: showScrollUp ? "auto" : "none",
                    transform: showScrollUp ? "translateY(0)" : "translateY(12px)"
                }}
                onMouseEnter={ (e) => { e.currentTarget.style.transform = "translateY(-5px)"; }}
                onMouseLeave={ (e) => { e.currentTarget.style.transform = showScrollUp ? "translateY(0)" : "translateY(10px)"; }}
                aria-label="Scroll Up"
            >
                ↑
            </button>
        </footer>
    );
};