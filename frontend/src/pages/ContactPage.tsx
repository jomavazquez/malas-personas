import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Footer, Logo, UnderlineLink } from "../components";
import { C, F } from "../lib";
import styles from "./ContactPage.module.css";

type Subject = "general" | "game" | "cards" | "press";

export const ContactPage = () => {

  const { t } = useTranslation();
  const [ form, setForm ] = useState({ name: "", email: "", message: "" });
  const [ subject, setSubject ] = useState<Subject>("general");
  const [ accepted, setAccepted ] = useState(false);
  const [ loading, setLoading ] = useState(false);
  const [ sent, setSent ] = useState(false);

  const subjects: { key: Subject; label: string }[] = [
    { 
      key: "general",
      label: t("contact.subject_general") 
    },
    { 
      key: "game",
      label: t("contact.subject_game")
    },
    { 
      key: "cards",
      label: t("contact.subject_cards")
    },
    { 
      key: "press",
      label: t("contact.subject_press")
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if( !accepted ) return;
    setLoading(true);
    // Aquí iría la llamada al backend cuando esté listo
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ background: "#fff", display: "flex", flexDirection: "column" }}>
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
            <div className="hidden md:flex flex-col justify-end pr-16 pb-12 relative" style={{ minHeight: 500 }}>
              <h3 className="heading_1" style={{ color: C.base }}>{ t("contact.leftTitle", "¿Una duda, una idea o un mazo nuevo?") }</h3>
              <div className={ styles.left_container }>
                <div>
                  <div className={ styles.left_sub } style={{ color: C.accentDeep }}>{ t("contact.writeUs") }</div>
                  <UnderlineLink to="mailto:hola@malaspersonas.com">hola@malaspersonas.com</UnderlineLink>
                </div>
                <div>
                  <div className={ styles.left_sub } style={{ color: C.accentDeep }}>{ t("contact.responseTime") }</div>
                  <span style={{ fontFamily: F.body, fontWeight: 600, fontSize: 16, color: C.base }}>{ t("contact.responseTimeValue") }</span>
                </div>
              </div>
              <div className={ styles.left_social }>
                  <Button to="https://www.linkedin.com/in/jomavazquez/" size="sm" target="_blank">in</Button>
              </div>
            </div>
            {/* RIGHT */}
            <div className="px-10 lg:px-25">
              {
                sent 
                ? 
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <h2 className="heading_1" style={{ color: C.base }}>{ t("contact.sentTitle") }</h2>
                    <p style={{ color: C.muted, marginTop: 15 }}>{ t("contact.sentDesc") }</p>
                  </div>
                :
                  <>
                    <Badge>{ t("footer.contact") }</Badge>
                    <h1 className="heading_1" style={{ color: C.base }}>{ t("contact.title") }</h1>
                    <p className={ styles.right_sub } style={{ color: C.muted }}>{ t("contact.subtitle") }</p>
                    <form onSubmit={ handleSubmit } className="form">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form_label" style={{ color: C.muted }}>{ t("contact.name") }</label>
                          <input
                            className="input"
                            name="name"
                            placeholder="Marina"
                            value={ form.name }
                            onChange={ handleChange }
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
                      </div>
                      <div>
                        <label className="form_label" style={{ color: C.muted }}>{ t("contact.subject") }</label>
                        <div className="right_chips_container">
                          {
                            subjects.map(({ key, label }) => (
                              <button
                                key={ key }
                                type="button"
                                onClick={ () => setSubject(key) }
                                className="right_chips"
                                style={{ border: `1.5px solid ${ subject === key ? C.accent : C.border }`, background: subject === key ? `color-mix(in srgb, ${C.accent} 10%, #fff)` : "#fff", color: C.base }}
                              >
                                { label }
                              </button>
                            ))
                          }
                        </div>
                      </div>
                      <div>
                        <label className="form_label" style={{ color: C.muted }}>{ t("contact.message", "Mensaje") }</label>
                        <textarea
                          className="input textarea"
                          name="message"
                          rows={ 5 }
                          placeholder={ t("contact.messagePlaceholder", "Cuéntanos en qué podemos ayudarte...") }
                          value={ form.message }
                          onChange={ handleChange }
                          required
                          style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                        />
                      </div>
                      <div className="terms_container" onClick={ () => setAccepted(!accepted) }>
                        <div className="checkbox" style={{ border: `2px solid ${ accepted ? C.accent : C.border }`, background: accepted ? C.accent : "#fff" }}>
                          { accepted && <span style={{ color: C.base, fontFamily: F.display }}>✓</span> }
                        </div>
                        <span style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>
                          { t("register.accept") }{" "}
                          <UnderlineLink to="/privacy-policy">{ t("footer.privacyPolicy").toLowerCase() }</UnderlineLink>
                          {" "}{ t("contact.privacy") }
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={ loading || !accepted }
                        className="btn"
                        style={{ background: loading || !accepted ? "#ccc" : C.accent, cursor: loading || !accepted ? "not-allowed" : "pointer", color: C.base }}
                      >
                        { loading ? "..." : t("contact.send") }
                      </button>
                    </form>
                  </>
              }
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};