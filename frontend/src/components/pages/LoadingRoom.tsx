import { t } from "i18next";
import { C } from "../../lib";
import { Footer, Logo, TopMenu } from "../../components";

export const LoadingRoom = () => {
    return (
        <div style={{ background: C.surface, position: "relative" }}>
            <nav className="flex items-center justify-between px-4 md:px-14 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
                <div className="max-w-360 mx-auto w-full flex items-center justify-between flex-col md:flex-row gap-4 md:gap-0">
                    <Logo />
                    <TopMenu />
                </div>
            </nav>
            <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 m-20 text-center">
                <h3 className="cta_title">{ t("game.loading") }</h3>
            </div>
            <Footer />
        </div>
    )
}