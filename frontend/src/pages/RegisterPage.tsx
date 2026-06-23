import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context";
import { Badge, Footer, Logo, UnderlineLink } from "../components";
import { api, C, F } from "../lib";
import type { User } from "../types";
import styles from "./RegisterPage.module.css";

export const RegisterPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [ form, setForm] = useState({ username: "", email: "", password: "" });
  const [ showPassword, setShowPassword ] = useState(false);
  const [ acceptTerms, setAcceptTerms ] = useState(false);
  const [ error, setError ] = useState("");
  const [ loading, setLoading ] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if( !acceptTerms ){ setError(t("errors.ACCEPT_TERMS")); return; }
    setError("");
    setLoading(true);
    try{
      const data = await api.post<{ user: User; token: string }>("/auth/register", form);
      login(data.user, data.token);
      navigate("/");
    }catch( err: unknown ){
      const code = (err as Error).message;
      setError(t(`errors.${code}`, code));
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
              <Logo dot="#a06a19" />
            </div>
          </div>
        </nav>
        {/* TWO COLUMNS */}
        <div className="flex-1 flex items-center px-4 md:px-14 py-12">
          <div className="max-w-360 mx-auto w-full grid grid-cols-1 md:grid-cols-[45%_55%] gap-0 items-center">
            {/* LEFT */}
            <div className="hidden md:flex flex-col justify-end pr-25 pb-12 relative">
              <h3 className="heading_1" style={{ color: C.base }}>{ t("register.headline")}</h3>
              <div className={ styles.list_sub }>
                {
                  [ t("features.1"), t("features.2"), t("features.3"), t("features.4") ].map((f) => (
                    <div key={ f } className="flex gap-3 items-center mb-3">
                      <span className="checkbox" style={{ background: C.base, color: C.accent }}>✓</span>
                      <span className="check_desc" style={{ color: C.base }}>{ f }</span>
                    </div>
                  ))
                }
              </div>
              {/* DARK CARD */}
              <div className={ styles.dark_box } style={{ background: C.base }}>
                <div className={ styles.dark_title }>{ t("register.cardTitle") }</div>
                <div className={ styles.dark_sub } style={{ color: C.faint }}>{ t("register.cardSub") }</div>
              </div>
            </div>
            {/* RIGHT */}
            <div className="pl-0 lg:pl-50 pr-0 md:pr-10 md:pl-10">
              <Badge>{ t("pricing.free") }</Badge>
              <h1 className="heading_1" style={{ color: C.base }}>{ t("auth.register") }</h1>
              <form onSubmit={ handleSubmit } className="form">
                <div>
                  <label className="form_label" style={{ color: C.muted }}>{ t("auth.username") }</label>
                  <input 
                    className="input" 
                    name="username" 
                    type="text" 
                    placeholder="Marina" 
                    value={ form.username } 
                    onChange={ handleChange } 
                    required 
                    style={{ border: `1.5px solid ${C.border}`, color: C.base }} 
                  />
                </div>
                <div>
                  <label className="form_label" style={{ color: C.muted }}>{ t("auth.email") }</label>
                  <input 
                    className="input" 
                    name="email" 
                    type="email" 
                    placeholder="marina@email.com" 
                    value={ form.email } 
                    onChange={ handleChange } 
                    required 
                    style={{ border: `1.5px solid ${C.border}`, color: C.base }} 
                  />
                </div>
                <div>
                  <label className="form_label" style={{ color: C.muted }}>{ t("auth.password") }</label>
                  <div style={{ position: "relative" }}>
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="show_pwd" style={{ color: C.muted }}>
                      { showPassword ? t("login.hide") : t("login.show") }
                    </button>
                  </div>
                  <p className={ styles.pwd_hint } style={{ color: C.faint }}>
                    { t("register.passwordHint") }
                  </p>
                </div>
                {/* TERMS */}
                <div className={ styles.terms_container } onClick={ () => setAcceptTerms(!acceptTerms) }>
                  <div className="checkbox" style={{ border: `2px solid ${acceptTerms ? C.accent : C.border}`, background: acceptTerms ? C.accent : "#fff" }}>
                    { acceptTerms && <span style={{ color: C.base, fontFamily: F.display }}>✓</span> }
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>
                    {t("register.acceptTerms", "Acepto los")}{" "}
                    <UnderlineLink to="/terms">{t("register.terms", "términos del servicio")}</UnderlineLink>
                    {" "}{t("register.and", "y la")}{" "}
                    <UnderlineLink to="/privacy">{t("register.privacy", "política de privacidad")}</UnderlineLink>.
                  </span>
                </div>
                {
                  error &&
                  <p className="error">{ error }</p>
                }
                <button
                  type="submit"
                  disabled={ loading }
                  className="btn"
                  style={{ background: loading ? "#ccc" : C.accent, cursor: loading ? "not-allowed" : "pointer", color: C.base }}
                >
                  { loading ? "..." : t("register.submit") }
                </button>
                <p className="just_play_text"  style={{ color: C.faint, textAlign: "center" }}>{ t("register.freeNote") }</p>
              </form>
              <p className="just_play_text" style={{ color: C.muted,  marginTop: 10, textAlign: "center" }}>
                { t("auth.hasAccount")}{" "}
                <UnderlineLink to="/login" color={ C.accent }>{ t("auth.loginLink") }</UnderlineLink>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};