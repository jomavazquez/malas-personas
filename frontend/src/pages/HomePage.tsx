import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, useJoinModal } from "../context";
import { getLenis } from "../hooks";
import { Avatar, Blob, Button, UnderlineLink, Footer, TopMenu, Badge, FloatingQuestion, BlackCard, PillToggle, StepCard } from "../components";
import { C, F, goToSection, SECTION_NAV_EVENT } from "../lib";
import type { GameType } from "../types";
import styles from "./HomePage.module.css";

export const HomePage = () => {

  const { t } = useTranslation();
  const { user } = useAuth();
  const { openJoinModal } = useJoinModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [ howGameType, setHowGameType ] = useState<GameType>("MALAS_PERSONAS");

  useEffect(() => {
    const state = location.state as { scrollTo?: string; gameType?: GameType } | null;
    if( state?.gameType ) setHowGameType(state.gameType);

    const id = state?.scrollTo;
    if( !id ) return;

    const attempt = () => {
      const el = document.getElementById(id);
      const lenis = getLenis();
      if( el && lenis ){
        lenis.scrollTo(el);
      }else{
        setTimeout(attempt, 100);
      }
    };

    setTimeout(attempt, 200);
  }, [ location.state ]);

  useEffect(() => {
    const handler = ( e: Event ) => {
      const detail = (e as CustomEvent<{ id?: string; gameType?: GameType }>).detail;
      if( detail?.id === "how" && detail.gameType ) setHowGameType(detail.gameType);
    };
    window.addEventListener(SECTION_NAV_EVENT, handler);
    return () => window.removeEventListener(SECTION_NAV_EVENT, handler);
  }, []);

  return (
    <div style={{ background: C.surface, position: "relative" }}>
      <TopMenu />
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
                { t("nav.createRoom") } →
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
            { value: t("stats.number"), label: t("stats.teams") },
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
      {/* ── VOM PROMO ── */}
      <div className={`py-16 md:py-20 px-8 md:px-14 ${ styles.vom }`} style={{ background: C.base }}>
        <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-10 items-center relative">
          <div>
            <Badge>{ t("vomPromo.badge") }</Badge>
            <h3 className="text-[32px] md:text-[40px] heading_1" style={{ color: "#fff" }}>
              { t("lobby.gameVOM") }<span style={{ color: C.accent }}>.</span>
            </h3>
            <p className={ styles.eyebrow_sub } style={{ color: C.faint }}>{ t("vomPromo.desc") }</p>
            <div className="flex flex-wrap gap-3">
              <Button to={ user ? "/lobby" : "/register" } state={ user ? { gameType: "V_O_M" } : undefined } bgColor={ C.accent } textColor={ C.base }>
                { t("vomPromo.cta") } →
              </Button>
              <Button textColor="#fff" onClick={ () => goToSection(navigate, "how", { gameType: "V_O_M" }) }>
                { t("how.eyebrow") }
              </Button>
            </div>
          </div>
          <div>
            {
              [
                { text: t("vomPromo.statement1") },
                { text: t("vomPromo.statement2"), lie: true },
                { text: t("vomPromo.statement3") }
              ].map((s, i) => (
                <div 
                  key={ `vom_${i}` } 
                  className={`flex items-center gap-3 mb-3 ${ styles.vom_letter }`} 
                  style={{ 
                    background: s.lie ? C.accent : "#fff", 
                    transform: s.lie ? "rotate(-2deg)" : "none", 
                    boxShadow: s.lie ? "0 14px 28px -12px rgba(0,0,0,.45)" : "none" 
                  }}
                >
                  <span className={ styles.vom_options } style={{ color: C.base }}>{ s.text }</span>
                </div>
              ))
            }
            <div className={ styles.sub } style={{ textAlign: "right", color: C.faint, marginTop: 10 }}>
              { t("vomPromo.question") }
            </div>
          </div>
        </div>
      </div>
      {/* ── HOW IT WORKS ── */}
      <div id="how" style={{ background: "#fff" }} className="py-15 md:py-20 px-8 md:px-14">
        <div className="max-w-360 mx-auto">
          <div className="text-center mb-8">
            <div className={ styles.sub } style={{ color: C.accentDeep, marginBottom: 10 }}>{ t("how.eyebrow") }</div>
            <h3 className="heading_1" style={{ color: C.base }}>{ t("how.title") }</h3>
          </div>
          <div className="flex justify-center mb-15">
            <PillToggle
              options={ [
                { value: "MALAS_PERSONAS", label: t("lobby.gameMP") },
                { value: "V_O_M", label: t("lobby.gameVOM") },
              ] }
              value={ howGameType }
              onChange={ (v) => setHowGameType(v as GameType) }
              showActiveDot={ false }
            />
          </div>
          {
            howGameType === "MALAS_PERSONAS"
            ?
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StepCard number={ 1 } title={ t("how.mp.step1.title") } description={ t("how.mp.step1.desc") }>
                  <div className={ styles.sc_code } style={{ background: C.base }}>
                    <div className="min-[768px]:hidden min-[950px]:block">
                      <span className={ styles.step1_code_label } style={{ color: C.accent }}>{ t("lobby.code") }</span>
                    </div>
                    <span className={ styles.step1_code }>9XK7Q2</span>
                  </div>
                </StepCard>
                <StepCard number={ 2 } title={ t("how.mp.step2.title") } description={ t("how.mp.step2.desc") }>
                  <div className="flex gap-2">
                    <Avatar label="M" bgColor={ C.accent } textColor={ C.base } size={ 40 } />
                    <Avatar label="D" bgColor="#556987" textColor="#fff" size={ 40 } />
                    <div className="min-[768px]:hidden min-[900px]:block">
                      <Avatar label="A" bgColor="#194068" textColor="#fff" size={ 40 } />
                    </div>
                    <div className="min-[768px]:hidden min-[1024px]:block">
                      <Avatar label="L" bgColor="#50545A" textColor="#fff" size={ 40 } />
                    </div>
                    <span className={ styles.avatar_plus } style={{ color: C.faint }}>+</span>
                  </div>
                </StepCard>
                <StepCard number={ 3 } title={ t("how.mp.step3.title") } description={ t("how.mp.step3.desc") }>
                  <div className="flex gap-2 flex-2">
                    <BlackCard question={ t("how.mp.step3.card") } fontSize={ 13 } />
                    <div className={ `min-[768px]:hidden min-[995px]:block ${ styles.white_card }`} style={{ border: `2px solid ${C.border}`, color: C.base }}>{ t("how.mp.step3.answer") }</div>
                  </div>
                </StepCard>
              </div>
            :
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StepCard number={ 1 } title={ t("how.vom.step1.title") } description={ t("how.vom.step1.desc") }>
                  <div className={ styles.sc_code } style={{ background: C.base }}>
                    <div className="min-[768px]:hidden min-[950px]:block">
                      <span className={ styles.step1_code_label } style={{ color: C.accent }}>{ t("lobby.code") }</span>
                    </div>
                    <span className={ styles.step1_code }>2FVCJF</span>
                  </div>
                </StepCard>
                <StepCard number={ 2 } title={ t("how.vom.step2.title") } description={ t("how.vom.step2.desc") }>
                  <div className="flex flex-col gap-2">
                    {
                      [
                        { text: t("how.vom.step2.statement1") },
                        { text: t("how.vom.step2.statement2") },
                        { text: t("how.vom.step2.statement3"), lie: true },
                      ].map((s, i) => (
                        <div key={ i } className={ styles.statement_row } style={{ background: s.lie ? C.accent : "#fff", color: C.base }}>
                          { s.text }
                        </div>
                      ))
                    }
                  </div>
                </StepCard>
                <StepCard number={ 3 } title={ t("how.vom.step3.title") } description={ t("how.vom.step3.desc") }>
                  <div className="flex flex-col gap-2" style={{ marginTop: "auto" }}>
                    <div className={ `${ styles.statement_row } ${ styles.vote_row }` } style={{ background: "#fff", color: C.base }}>
                      <span>{ t("how.vom.step3.optionA") }</span>
                    </div>
                    <div className={ `${ styles.statement_row } ${ styles.vote_row }` } style={{ background: C.base, color: "#fff" }}>
                      <span>{ t("how.vom.step3.optionB") }</span>
                      <span className={ styles.vote_count } style={{ color: "#8BC34A" }}>{ t("how.vom.step3.votes") }</span>
                    </div>
                  </div>
                </StepCard>
              </div>
          }
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