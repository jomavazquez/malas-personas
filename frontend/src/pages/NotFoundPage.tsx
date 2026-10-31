import { useTranslation } from "react-i18next";
import { Badge, Button, Footer, TopMenu, UnderlineLink } from "../components";
import { C, F } from "../lib";
import styles from "../components/pages/RoomNotFound.module.css";

// Catch-all for unknown URLs. The SPA fallback answers them with HTTP 200, so the
// noindex tag is what tells search engines this is not a real page (a "soft 404").
export const NotFoundPage = () => {

  const { t } = useTranslation();

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <meta name="robots" content="noindex" />
      <TopMenu />
      <div className={ styles.container }>
        <div className={ styles.cards_containter }>
          <div className={ `${ styles.card } ${ styles.card_black }` } />
          <div className={ `${ styles.card } ${ styles.card_white }` }><span style={{ fontFamily: F.display, fontSize: 50, color: "#E5534B" }}>?</span></div>
        </div>
        <Badge color="#E5534B">{ t("errors.PAGE_NOT_FOUND") }</Badge>
        <h1 className={`heading_1 ${ styles.title }`} style={{ color: C.base }}>{ t("errors.pageNotFoundTitle") }</h1>
        <p className={ styles.desc } style={{ color: C.base }}>{ t("errors.pageNotFoundDesc") }</p>
        <div className={ styles.actions }>
          <Button to="/">{ t("errors.goHome") }</Button>
          <UnderlineLink to="/help-center">{ t("footer.helpCenter") }</UnderlineLink>
        </div>
      </div>
      <Footer />
    </div>
  );
};