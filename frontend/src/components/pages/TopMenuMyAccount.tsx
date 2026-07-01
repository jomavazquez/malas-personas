import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { Avatar, LanguageSelector, UnderlineLink } from "../../components";

export const TopMenuMyAccount = () => {

  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const roomLabel = t(user ? "myroom.title" : "nav.login");
  const deckLabel = t(user ? "mydecks.title" : "nav.login");
  const roomLabelShort = t(user ? "myroom.titleShort" : "nav.login");
  const deckLabelShort = t(user ? "mydecks.titleShort" : "nav.login");  

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="flex items-center gap-5 lg:gap-8">
      <UnderlineLink to={ user ? "/my-rooms" : "/login" }>
        <span className="hidden lg:inline">{ roomLabel }</span>
        <span className="lg:hidden">{ roomLabelShort }</span>
      </UnderlineLink>
      <UnderlineLink to={ user ? "/my-decks" : "/login" }>
        <span className="hidden lg:inline">{ deckLabel }</span>
        <span className="lg:hidden">{ deckLabelShort }</span>
      </UnderlineLink>
      <LanguageSelector />
      <div className="hidden md:block">
        <Avatar user={ user?.username } showLabel />
      </div>
      <button className="btn_red" onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
    </div>
  );
};