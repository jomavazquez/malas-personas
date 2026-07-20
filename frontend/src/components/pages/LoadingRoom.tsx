import { useTranslation } from "react-i18next";
import { C } from "../../lib";
import { Footer, TopMenu } from "../../components";

export const LoadingRoom = () => {

    const { t } = useTranslation();
    
    return (
        <div style={{ background: C.surface, position: "relative" }}>
            <TopMenu />
            <div className="max-w-360 mx-auto w-full px-10 2xl:px-0 m-20 text-center">
                <h3 className="cta_title">{ t("game.loading") }</h3>
            </div>
            <Footer />
        </div>
    )
}