import { useTranslation } from "react-i18next";
import { useAuth, useJoinModal } from "../context";
import { Avatar, Blob, Logo, Button, UnderlineLink, Footer, TopMenu, Badge, FloatingQuestion } from "../components";
import { C, F } from "../lib";
import styles from "./HomePage.module.css";

export const HomePage = () => {

  const { t } = useTranslation();
  const { user } = useAuth();
  const { openJoinModal } = useJoinModal();

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 h-16 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
          <TopMenu />
        </div>
      </nav>
      {/* ── HERO ── */}
      <div className="relative px-4 md:px-14 pt-6 pb-10 md:pb-16" style={{ zIndex: 3 }}>
        <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-5 items-center" style={{ minHeight: 520, position: "relative", zIndex: 4 }}>
          <Blob size={ 680 } color="#acacac" blur={ 20 } style={{ top: -280, left: -160 }} />
          {/* Left — accent card */}
          <div className="p-7 md:p-14" style={{ background: C.accent, zIndex: 1, borderRadius: "16px 48px 16px 48px", boxShadow: `0 30px 60px -30px color-mix(in srgb, ${C.accent} 70%, transparent)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 13, letterSpacing: "0.09em", textTransform: "uppercase", color: C.accentDeep, marginBottom: 20 }}>
              {t("hero.eyebrow")}
            </div>
            <h2 className="text-[48px] md:text-[62px]" style={{ fontFamily: F.display, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.04em", color: C.base, margin: "0 0 22px" }}>
              {t("hero.headline")}
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 17, lineHeight: 1.6, color: C.accentMid, margin: "0 0 34px", maxWidth: 380, fontWeight: 500 }}>
              {t("hero.sub")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button to={ user ? "/lobby" : "/register" }>
                { t("lobby.createRoom") } →
              </Button>
              <Button variant="outline" onClick={ openJoinModal }>
                { t("hero.haveCode") }
              </Button>
            </div>
            {
              !user && 
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 15, color: C.accentDeep, marginTop: 20 }}>
                { t("hero.alreadyHaveAnAccount") }{" "}
                <UnderlineLink to="/login">
                  { t("auth.loginLink") }
                </UnderlineLink>
              </div>
            }
          </div>
          {/* Right — card fan (hidden on mobile) */}
          <div className="hidden md:block relative" style={{ height: 460 }}>
            <Blob size={ 400 } color={ C.accent } blur={ 80 } style={{ bottom: -200, left: "50%", transform: "translateX(-50%)" }} />
            <FloatingQuestion />
            <div className={ styles.cards_container }>
              {([
                { text: t("hero.answer1"), bg: "#fff", color: C.base, transform: "translate(-245px, -25px) rotate(-19deg)" },
                { text: t("hero.answer2"), bg: "#fff", color: C.base, transform: "translate(-140px, -60px) rotate(-9deg)" },
                { text: t("hero.answer3"), bg: C.accent, color: C.base, transform: "translate(-30px, -90px) rotate(2deg)", label: t("hero.yourmove"), zIndex: 4 },
                { text: t("hero.answer4"), bg: "#fff", color: C.base, transform: "translate(100px, -60px) rotate(12deg)", zIndex: 2 },
              ] as { text: string; bg: string; color: string; transform: string; label?: string; zIndex?: number }[]).map((card, i) => (
                <div key={ i } style={{ position: "absolute", width: i === 2 ? 160 : 148, background: card.bg, borderRadius: 16, padding: i === 2 ? 18 : 17, transform: card.transform, boxShadow: i === 2 ? `0 24px 44px -16px color-mix(in srgb, ${C.accent} 60%, transparent)` : "0 18px 36px -16px rgba(47,52,58,.4)", transformOrigin: "bottom center", zIndex: card.zIndex ?? 3 }}>
                  <div className={ styles.card_title } style={{ color: card.color }}>{ card.text }</div>
                  {
                    card.label && 
                    <div className={ styles.card_sublabel } style={{ color: C.accentDeep }}>{ card.label }</div>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ── STATS ── */}
      <div style={{ background: C.base, position: 'relative', zIndex: 10 }}>
        <div className="max-w-360 mx-auto grid grid-cols-1 sm:grid-cols-3 px-8 md:px-14" style={{ zIndex: 1, position: 'relative' }}>
          {[
            { value: "12,400+", label: t("stats.teams") },
            { value: "20", label: t("stats.players") },
            { value: "2 min", label: t("stats.time") },
          ].map((s, i) => (
            <div key={ s.label } className={`text-center py-7 ${i < 2 ? "sm:border-r border-[#3C424A]" : ""} ${ i > 0 ? "sm:pl-10" : "" }`}>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 50, color: "#fff" }}>
                {
                  s.value.endsWith("+")
                  ? <>{ s.value.slice(0, -1) }<span style={{ color: C.accent }}>+</span></>
                  : s.value
                }
              </div>
              <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 16, color: C.faint, marginTop: 5 }}>{ s.label }</div>
            </div>
          ))}
        </div>
      </div>
      {/* ── HOW IT WORKS ── */}
      <div id="how" style={{ background: "#fff" }} className="py-15 md:py-20 px-8 md:px-14">
        <div className="max-w-360 mx-auto">
          <div className="text-center mb-15">
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 13, letterSpacing: "0.09em", textTransform: "uppercase", color: C.accentDeep, marginBottom: 10 }}>{ t("how.eyebrow") }</div>
            <h3 className="heading_1" style={{ color: C.base }}>{ t("how.title") }</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* STEP 1 */}
            <div style={{ background: C.surface, borderRadius: 20, padding: "30px" }}>
              <div className={ styles.step_number } style={{ color: C.accent }}>1</div>
              <div className={ styles.step_title } style={{ color: C.base }}>{ t("how.step1.title") }</div>
              <div className={ styles.step_body } style={{ color: C.muted }}>{ t("how.step1.desc") }</div>
              <div style={{ background: C.base, borderRadius: 12, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.body, fontWeight: 800, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: C.accent }}>{ t("lobby.code") }</span>
                <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, letterSpacing: "0.15em", color: "#fff" }}>9XK7Q2</span>
              </div>
            </div>
            {/* Step 2 */}
            <div style={{ background: C.surface, borderRadius: 20, padding: "30px" }}>
              <div className={ styles.step_number} style={{ color: C.accent }}>2</div>
              <div className={ styles.step_title } style={{ color: C.base }}>{ t("how.step2.title") }</div>
              <div className={ styles.step_body } style={{ color: C.muted }}>{ t("how.step2.desc") }</div>
              <div className="flex gap-2">
                <Avatar label="M" bgColor={ C.accent } textColor={ C.base } size={ 40 } />
                <Avatar label="D" bgColor="#556987" textColor="#fff" size={ 40 } />
                <Avatar label="A" bgColor="#194068" textColor="#fff" size={ 40 } />
                <Avatar label="L" bgColor="#50545A" textColor="#fff" size={ 40 } />
                <span className={ styles.avatar_plus } style={{ color: C.faint }}>+</span>
              </div>
            </div>
            {/* Step 3 */}
            <div style={{ background: C.surface, borderRadius: 20, padding: "30px" }}>
              <div className={ styles.step_number} style={{ color: C.accent }}>3</div>
              <div className={ styles.step_title } style={{ color: C.base }}>{ t("how.step3.title") }</div>
              <div className={ styles.step_body } style={{ color: C.muted }}>{ t("how.step3.desc") }</div>
              <div className="flex gap-2">
                <div style={{ flex: 1, background: C.base, borderRadius: 12, padding: 12, fontFamily: F.display, fontWeight: 800, fontSize: 13, color: "#fff", lineHeight: 1.2 }}>{ t("how.step3.card") }</div>
                <div style={{ flex: 1, background: "#fff", border: `2px solid ${C.border}`, borderRadius: 12, padding: 12, fontFamily: F.display, fontWeight: 700, alignContent: "center", fontSize: 13, color: C.base, lineHeight: 1.2 }}>{ t("how.step3.answer") }</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Register CTA ── */}
      <div style={{ background: C.surface, position: "relative", overflow: "hidden" }} className="py-16 md:py-20 px-8 md:px-14">
        <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-10 items-center relative">
          <div>
            <div className={ styles.eyebrow } style={{ color: C.accentDeep }}>{ t("pricing.eyebrow") }</div>
            <h3 className="text-[32px] md:text-[40px] heading_1" style={{ color: C.base }}>{ t("pricing.title") }</h3>
            <p className={ styles.eyebrow_sub } style={{ color: C.muted }}>{ t("pricing.sub") }</p>
            {
              [t("features.1"), t("features.2"), t("features.3"), t("features.4")].map((f) => (
              <div key={f} className="flex gap-3 items-center mb-3">
                <span className="checkbox" style={{ background: C.accent, color: C.base }}>✓</span>
                <span className="check_desc" style={{ color: C.subtle }}>{ f }</span>
              </div>
              ))
            }
          </div>
          <div className="cta_container" style={{ border: `1px solid ${C.borderMid}` }}>
            <Badge>{ t("pricing.free") }</Badge>
            <div className="cta_title" style={{ color: C.base }}>{ t("auth.register") }</div>
            <div className="form_label" style={{ color: C.muted }}>{ t("auth.username") }</div>
            <div className="input" style={{ border: `1.5px solid ${C.border}`, color: C.faint, marginBottom: 15 }}>Marina</div>
            <div className="form_label" style={{ color: C.muted }}>{ t("auth.email") }</div>
            <div className="input" style={{ border: `1.5px solid ${C.border}`, color: C.faint, marginBottom: 25 }}>{ t("auth.emailPlaceholder") }</div>
            <Button
              to={ user ? undefined : "/register" }
              bgColor={ C.accent }
              textColor="#000"
              style={{ boxShadow: `0 16px 30px -14px color-mix(in srgb, ${C.accent} 60%, transparent)`, ...(user && { width: "100%" })  }}
            >
              { t("pricing.startFree") }
            </Button>
            {
              !user &&
              <div className={ styles.cta_login } style={{ color: C.faint }}>
                { t("auth.hasAccount")}{" "}<UnderlineLink to="/login">{ t("auth.loginLink") }</UnderlineLink>
              </div>
            }
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};