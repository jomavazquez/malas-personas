import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { Avatar, LanguageSelector, Logo, UnderlineLink } from "../../components";

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
  <>
    {/* XL */}
    <div className="hidden xl:flex items-center justify-between w-full">
      <Logo />
      <div className="flex items-center gap-8">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ roomLabel }</UnderlineLink>
        <UnderlineLink to={ user ? "/my-decks" : "/login" }>{ deckLabel }</UnderlineLink>
        <LanguageSelector />
        <Avatar user={ user?.username } showLabel />
        <button className="btn_red" onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
    </div>
    {/* LG */}
    <div className="hidden lg:flex xl:hidden items-center justify-between w-full">
      <Logo />
      <div className="flex items-center gap-8">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ roomLabelShort }</UnderlineLink>
        <UnderlineLink to={ user ? "/my-decks" : "/login" }>{ deckLabelShort }</UnderlineLink>
        <LanguageSelector />
        <Avatar user={ user?.username } showLabel />
        <button className="btn_red" onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
    </div>
    {/* MD */}
    <div className="hidden md:flex lg:hidden items-center justify-between w-full">
      <Logo />
      <div className="flex items-center gap-5">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ roomLabelShort }</UnderlineLink>
        <UnderlineLink to={ user ? "/my-decks" : "/login" }>{ deckLabelShort }</UnderlineLink>
        <LanguageSelector />
        <button className="btn_red" onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
    </div>
    {/* MOBILE */}
    <div className="flex md:hidden flex-col items-center gap-4 w-full pb-2">
      <Logo />
      <div className="flex items-center gap-6">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ roomLabelShort }</UnderlineLink>
        <UnderlineLink to={ user ? "/my-decks" : "/login" }>{ deckLabelShort }</UnderlineLink>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSelector />
        <button className="btn_red" onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
    </div>
  </>
  );
};