import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { Avatar, LanguageSelector, UnderlineLink } from "../../components";
import styles from "./TopMenuMyAccount.module.css";

export const TopMenuMyAccount = () => {

  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden md:flex items-center gap-6">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ t( user ? "nav.myRooms" : "nav.login") }</UnderlineLink>
        <LanguageSelector />
        <Avatar user={ user?.username } showLabel />
        <button className={ styles.logout } onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
      {/* MOBILE */}
      <div className="flex md:hidden items-center gap-10">
        <UnderlineLink to={ user ? "/my-rooms" : "/login" }>{ t( user ? "nav.myRooms" : "nav.login") }</UnderlineLink>
        <LanguageSelector />
        <button className={ styles.logout } onClick={ handleLogout } title={ t("auth.logout") }>⏻</button>
      </div>
    </>
  );
};