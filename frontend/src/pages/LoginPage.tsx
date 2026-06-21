import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Badge, FloatingQuestion, Footer, JoinModal, Logo, UnderlineLink } from "../components";
import { api, C, F } from "../lib";
import type { User } from "../types";
import styles from "./LoginPage.module.css";

export const LoginPage = () => {

  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [ joinModalOpen, setJoinModalOpen ] = useState(false);
  const [ form, setForm ] = useState({ identifier: "", password: "" });
  const [ showPassword, setShowPassword ] = useState(false);
  const [ keepSession, setKeepSession ] = useState(true);
  const [ error, setError ] = useState("");
  const [ loading, setLoading ] = useState(false);

  const isEmail = form.identifier.includes("@");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try{
      const data = await api.post<{ user: User; token: string }>("/auth/login", form);
      login(data.user, data.token, keepSession);
      navigate("/");
    }catch( err: unknown ){
      const code = (err as Error).message;
      const key = `errors.${code}`;
      setError(t(key, code));
    }finally{
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* ── GREEN BG HALF ── */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 w-[45%]" style={{ background: C.accent, zIndex: 0 }} />
      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        {/* NAV */}
        <nav className="px-4 md:px-14 pt-6 md:pt-10 h-16 flex items-center">
          <div className="max-w-360 mx-auto w-full grid grid-cols-1 md:grid-cols-[45%_55%]">
            <div className="flex items-center">
              <Logo dot="#7ca011" />
            </div>
          </div>
        </nav>
        {/* TWO COLUMNS */}
        <div className="flex-1 flex items-center px-4 md:px-14 py-12">
          <div className="max-w-360 mx-auto w-full grid grid-cols-1 md:grid-cols-[45%_55%] gap-0 items-center">
            {/* LEFT */}
            <div className="hidden md:flex flex-col justify-end pr-16 pb-12 relative" style={{ minHeight: 520 }}>
              <FloatingQuestion left={ 295 } top={ 75 } />
              <h3 className="heading_1" style={{ color: C.base }}>{ t("login.welcome") }</h3>
              <p className={ styles.welcome_sub } style={{ color: C.accentDeep }}>{ t("login.welcomeSub") }</p>
            </div>
            {/* RIGHT */}
            <div className="pl-0 lg:pl-50 pr-0 md:pr-10 md:pl-10">
              <Badge>{ t("login.badge") }</Badge>
              <h1 className="heading_1" style={{ color: C.base }}>{ t("auth.login") }</h1>
              <form onSubmit={ handleSubmit } className="form">
                <div>
                  <label className="form_label" style={{ color: C.muted }}>{ t("auth.emailOrUsername") }</label>
                  <input 
                    className="input" 
                    name="identifier" 
                    type={ isEmail ? "email" : "text" }
                    placeholder="marina@email.com" 
                    value={ form.identifier } 
                    onChange={ handleChange } 
                    required 
                    style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form_label" style={{ color: C.muted }}>{ t("auth.password") }</label>
                    <Link to="/forgot-password" className={ styles.forgot_pwd } style={{ color: C.accent }}>{ t("login.forgot") }</Link>
                  </div>
                  <div  style={{ position: "relative" }}>
                    <input 
                      className="input" 
                      name="password" 
                      type={ showPassword ? "text" : "password" } 
                      placeholder="••••••••••" 
                      value={ form.password } 
                      onChange={ handleChange } 
                      required 
                      style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="show_pwd"
                      style={{ color: C.muted }}
                    >
                      { showPassword ? t("login.hide") : t("login.show") }
                    </button>
                  </div>
                </div>
                <div className={ styles.keepme_container } onClick={ () => setKeepSession(!keepSession) }>
                  <div className="checkbox" style={{ border: `2px solid ${ keepSession ? C.accent : C.border }`, background: keepSession ? C.accent : "#fff" }}>
                    { keepSession && <span style={{ color: C.base, fontFamily: F.display }}>✓</span> }
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{ t("login.keepSession") }</span>
                </div>
                {
                  error && 
                  <p className="error">{ error }</p>
                }
                <button 
                  type="submit" 
                  disabled={ loading } 
                  className="btn"
                  style={{ background: loading ? "#ccc" : C.base, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  { loading ? "..." : t("login.submit") }
                </button>
              </form>
              <div className={ styles.just_play }>
                <p className="just_play_text" style={{ color: C.muted }}>
                  { t("login.justPlay") }{" "}
                  <UnderlineLink onClick={ () => setJoinModalOpen(true) }>{ t("login.joinWithCode") }</UnderlineLink>
                  {" "}— { t("login.noAccount2") }
                </p>
                <p className="just_play_text" style={{ color: C.muted }}>
                  { t("auth.noAccount")}{" "}
                  <UnderlineLink to="/register" color={ C.accent }>{ t("login.createFree") }</UnderlineLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <JoinModal isOpen={ joinModalOpen } onClose={() => setJoinModalOpen(false)} />
      <Footer />
    </div>
  );
};