import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { goToSection, C, F } from "../../lib";
import { UnderlineLink, LanguageSelector, Button } from "../../components";

export const TopMenu = () => {

    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <>
            <div className="hidden md:flex items-center gap-6" style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: C.subtle }}>
                <div className="min-[768px]:hidden min-[901px]:block">
                    <UnderlineLink onClick={() => goToSection(navigate, "how")}>
                        { t("nav.howItWorks") }
                    </UnderlineLink>
                </div>
                <UnderlineLink to={ user ? "/my-rooms" : "/login" }>
                    { t( user ? "nav.myRooms" : "nav.login") }
                </UnderlineLink>
                <LanguageSelector />
                <Button to={ user ? "/lobby" : "/register" } size="sm">
                    { t("nav.createRoom") }
                </Button>
            </div>
            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-3">
                <LanguageSelector />
            </div>
        </>
    )
}