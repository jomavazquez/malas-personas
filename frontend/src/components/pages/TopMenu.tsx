import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { goToSection, C, F } from "../../lib";
import { UnderlineLink, LanguageSelector, Button, Logo, TopMenuMyAccount } from "../../components";

export const TopMenu = () => {

    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="flex items-center justify-between px-4 md:px-14 h-auto relative pt-6 md:pt-10" style={{ zIndex: 10 }}>
            <div className="max-w-360 mx-auto w-full flex items-center justify-between">
                
                {
                    user
                    ? <TopMenuMyAccount />
                    : 
                        <>
                            <Logo />
                            <div className="hidden md:flex items-center gap-6" style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: C.subtle }}>
                                <div className="min-[768px]:hidden min-[901px]:block">
                                    <UnderlineLink onClick={() => goToSection(navigate, "how")}>{ t("nav.howItWorks") }</UnderlineLink>
                                </div>
                                <UnderlineLink to={ user ? "/my-rooms" : "/login" }>
                                    { t( user ? "nav.myAccount" : "nav.login") }
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
                }
            </div>
        </nav>
    )
}