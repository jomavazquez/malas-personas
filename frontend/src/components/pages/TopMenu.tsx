import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { scrollTo, C, F } from "../../lib";
import { UnderlineLink, LanguageSelector, Button } from "../../components";

export const TopMenu = () => {

    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <>
            <div className="hidden md:flex items-center gap-6" style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: C.subtle }}>
                <UnderlineLink onClick={ scrollTo("how") } >{ t("nav.howItWorks") }</UnderlineLink>
                <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ t( user ? "nav.myRooms" : "nav.login") }</UnderlineLink>
                <LanguageSelector />
                <Button to={ user ? "/lobby" : "/register" } size="sm">{ t("nav.createRoom") }</Button>
            </div>
            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-3">
                <LanguageSelector />
            </div>
        </>
    )
}