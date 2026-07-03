import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Footer, Logo, UnderlineLink } from "../components";
import { api, C } from "../lib";
import styles from "./ForgotPasswordPage.module.css";

type Step = 1 | 2 | 3;

const steps = [
    { key: "forgot.step1" },
    { key: "forgot.step2" },
    { key: "forgot.step3" },
];

export const ForgotPasswordPage = () => {
    
    const { t, i18n } = useTranslation();

    const [ step, setStep ] = useState<Step>(1);
    const [ email, setEmail ] = useState("");
    const [ code, setCode ] = useState<string[]>(Array(6).fill(""));
    const [ password, setPassword ] = useState("");
    const [ passwordConfirm, setPasswordConfirm ] = useState("");
    const [ showPassword, setShowPassword ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState("");
    const [ resendTimer, setResendTimer ] = useState(0);

    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
    const isMobile = window.innerWidth < 768;

    const MINUTES = 600;

    // Countdown for resend
    useEffect(() => {
        if( resendTimer <= 0 ) return;
        const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [ resendTimer ]);

    const joinCode = code.join("");
    const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

    // ── STEP 1: Send code ────────────────────────────────────────────────────
    const handleSendCode = async () => {
        if( !email.trim() ) return;
        setError("");
        setLoading(true);
        try{
            await api.post("/auth/forgot-password", { email: email.trim(), lang: i18n.language.startsWith("es") ? "es" : "en" });
            setStep(2);
            setResendTimer(MINUTES);
        }catch( err ){
            const errCode = (err as Error).message;
            setError(t(`errors.${errCode}`, errCode));
        }finally{
            setLoading(false);
        }
    };

    // ── STEP 2: Verify code ──────────────────────────────────────────────────
    const handleVerifyCode = async () => {
        if( joinCode.length < 6 ) return;
        setError("");
        setLoading(true);
        try{
            await api.post("/auth/verify-code", { email, code: joinCode });
            setStep(3);
        }catch( err ){
            const errCode = (err as Error).message;
            setError(t(`errors.${errCode}`, errCode));
        }finally{
            setLoading(false);
        }
    };

    // ── STEP 3: Reset password ───────────────────────────────────────────────
    const handleResetPassword = async () => {
        if( !passwordValid || password !== passwordConfirm ) return;
        setError("");
        setLoading(true);
        try{
            await api.post("/auth/reset-password", { email, code: joinCode, password });
            setStep(1);
            setEmail("");
            setCode(Array(6).fill(""));
            setPassword("");
            setPasswordConfirm("");
            window.location.href = "/login";
        }catch( err ){
            const errCode = (err as Error).message;
            setError(t(`errors.${errCode}`, errCode));
        }finally{
            setLoading(false);
        }
    };

    const handleCodeInput = (i: number, val: string) => {
        const char = val.replace(/\D/g, "").slice(-1);
        const newCode = [...code];
        newCode[i] = char;
        setCode(newCode);
        if( char && i < 5 ) codeRefs.current[i + 1]?.focus();
    };

    const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
        if( e.key === "Backspace" && !code[i] && i > 0 ){
            codeRefs.current[i - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if( resendTimer > 0 ) return;
            setError("");
            setLoading(true);
        try{
            await api.post("/auth/forgot-password", { email, lang: i18n.language.startsWith("es") ? "es" : "en" });
            setResendTimer(MINUTES);
            setCode(Array(6).fill(""));
        }catch{
        }finally{
            setLoading(false);
        }
    };

    const leftContent = {
        1: {
            title: t("forgot.leftTitle1"),
            sub: t("forgot.leftSub1"),
        },
        2: {
            title: t("forgot.leftTitle2"),
            sub: t("forgot.leftSub2"),
        },
        3: {
            title: t("forgot.leftTitle3"),
            sub: t("forgot.leftSub3"),
        },
    };

    return (
        <div style={{ background: "#fff", display: "flex", flexDirection: "column" }}>
            {/* ── ORANGE BG HALF ── */}
        <div className="hidden md:block fixed top-0 left-0 bottom-0 w-[45%]" style={{ background: C.accent, zIndex: 0 }} />
        <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
            {/* NAV */}
            <nav className="px-4 md:px-14 pt-6 md:pt-10 h-16 flex items-center">
                <div className="max-w-360 mx-auto w-full grid grid-cols-1 md:grid-cols-[45%_55%]">
                    <div className="flex items-center">
                        <Logo dot={ isMobile ? C.accent : "#a06a19" } />
                    </div>
                </div>
            </nav>
            {/* TWO COLUMNS */}
            <div className="flex-1 flex items-center px-4 md:px-14 py-12">
                <div className="max-w-360 mx-auto w-full grid grid-cols-1 md:grid-cols-[45%_55%] gap-0 items-center">
                    {/* LEFT */}
                    <div className="hidden md:flex flex-col justify-end pr-16 pb-12 relative" style={{ minHeight: 520 }}>
                        {/* STEPS */}
                        <div className={ styles.steps_container }>
                        {
                            steps.map((s, i) => {
                                const num = i + 1;
                                const done = step > num;
                                const active = step === num;
                                return (
                                    <div key={ s.key } className={ styles.steps_div }>
                                        <div 
                                            className={ styles.steps_circle }
                                            style={{
                                                background: done || active ? C.base : "transparent",
                                                border: `2px solid ${done || active ? C.base : "rgba(0, 0, 0, 0.45)"}`,
                                                color: done || active ? "#fff" : "rgba(0, 0, 0, 0.45)",
                                            }}
                                        >
                                            { done ? "✓" : num }
                                        </div>
                                        <span
                                            className={ styles.steps_circle_lbl }
                                            style={{ 
                                                fontWeight: active ? 700 : 500, 
                                                color: active ? C.base : done ? C.base : "rgba(0, 0, 0, 0.45)",
                                            }}
                                        >
                                            { t(`forgot.step${num}`, [t("forgot.step1"), t("forgot.step2"), t("forgot.step3")][i]) }
                                        </span>
                                    </div>
                                );
                            })
                        }
                        </div>
                        <p className={ styles.steps_desc } style={{ color: C.base }}>
                            { leftContent[step].title }<br />
                            <span style={{ color: C.accentDeep }}>{leftContent[step].sub}</span>
                        </p>
                    </div>
                    {/* RIGHT */}
                    <div className="px-10 lg:px-25">
                        <Badge>{ `${t("forgot.step")} ${step} ${ t("mydecks.of") } 3` }</Badge>
                        {/* ── STEP 1 ── */}
                        {
                            step === 1 && 
                            <>
                                <h1 className="heading_1" style={{ color: C.base }}>{ t("forgot.title1") }</h1>
                                <p className="welcome_sub" style={{ color: C.muted }}>{ t("forgot.desc1") }</p>
                                <div className="form">
                                    <div>
                                        <label className="form_label" style={{ color: C.muted }}>{ t("forgot.emailLabel") }</label>
                                        <input
                                            className="input"
                                            type="email"
                                            placeholder="marina@email.com"
                                            value={ email }
                                            onChange={ (e) => setEmail(e.target.value) }
                                            onKeyDown={ (e) => e.key === "Enter" && handleSendCode() }
                                            style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                                        />
                                    </div>
                                    { 
                                        error && <p className="error">{ error }</p> 
                                    }
                                    <button
                                        onClick={ handleSendCode }
                                        disabled={ !email.trim() || loading }
                                        className="btn"
                                        style={{ background: !email.trim() || loading ? "#ccc" : C.base, cursor: !email.trim() || loading ? "not-allowed" : "pointer" }}
                                    >
                                        { loading ? "..." : t("forgot.sendCode") }
                                    </button>
                                    <p style={{ fontSize: 15, color: C.muted }}>
                                        ← { t("forgot.backTo") }{" "}
                                        <UnderlineLink to="/login" color={ C.accent }>{ t("auth.login") }</UnderlineLink>
                                    </p>
                                </div>
                            </>
                        }
                        {/* ── STEP 2 ── */}
                        {
                            step === 2 &&
                            <>
                                <h1 className="heading_1" style={{ color: C.base }}>{ t("forgot.title2") }</h1>
                                <p className="welcome_sub" style={{ color: C.muted, maxWidth: 500 }}>
                                    { t("forgot.desc2") }{" "}<strong style={{ color: C.base }}>{ email }</strong>.<br />{ t("forgot.desc2Spam") }
                                </p>
                                <div className="form">
                                    {/* CODE INPUTS */}
                                    <div style={{ display: "flex", gap: 10 }}>
                                    {
                                        code.map((c, i) => (
                                            <input
                                                key={ i }
                                                ref={ (el) => { codeRefs.current[i] = el; } }
                                                className={`input ${ styles.code }`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={ 1 }
                                                value={ c }
                                                onChange={ (e) => handleCodeInput(i, e.target.value) }
                                                onKeyDown={ (e) => handleCodeKeyDown(i, e) }
                                                style={{
                                                    border: `1.5px solid ${ c ? C.accent : C.border }`, 
                                                    color: C.base
                                                }}
                                            />
                                        ))
                                    }
                                    </div>
                                    {/* TIMER + RESEND */}
                                    <div className={ styles.timer_container }>
                                        {
                                            resendTimer > 0 
                                            ? 
                                                <span style={{ fontSize: 14, color: C.faint }}>
                                                    { t("forgot.expiresIn") }{" "}
                                                    <strong>{ String(Math.floor(resendTimer / 60)).padStart(2,"0")}:{String(resendTimer % 60).padStart(2,"0") }</strong>
                                                </span>
                                            : <span />
                                        }
                                        <UnderlineLink onClick={ handleResend } color={ C.accent }>{ t("forgot.resend") }</UnderlineLink>
                                    </div>
                                    { 
                                        error && 
                                        <p className="error">{ error }</p>
                                    }
                                    <button
                                        onClick={ handleVerifyCode }
                                        disabled={ joinCode.length < 6 || loading }
                                        className="btn"
                                        style={{ 
                                            background: joinCode.length < 6 || loading ? "#ccc" : C.accent, 
                                            cursor: joinCode.length < 6 || loading ? "not-allowed" : "pointer", 
                                            color: C.base 
                                        }}
                                    >
                                        { loading ? "..." : t("forgot.verifyCode") }
                                    </button>
                                    <p style={{ fontSize: 15, color: C.muted }}>
                                        ← { t("forgot.useAnother", "Usar otro") }{" "}
                                        <UnderlineLink onClick={ () => { setStep(1); setError(""); setCode(Array(6).fill("")); } } color={ C.accent }>
                                            { t("auth.email").toLowerCase() }
                                        </UnderlineLink>
                                    </p>
                                </div>
                            </>
                        }
                        {/* ── STEP 3 ── */}
                        {
                            step === 3 && 
                            <>
                                <h1 className="heading_1" style={{ color: C.base }}>{ t("forgot.title3") }</h1>
                                <p className="welcome_sub" style={{ color: C.muted }}>{ t("forgot.desc3") }</p>
                                <div className="form">
                                    <div>
                                        <label className="form_label" style={{ color: C.muted }}>{ t("forgot.newPassword") }</label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                className="input"
                                                type={ showPassword ? "text" : "password" }
                                                placeholder="••••••••••"
                                                value={ password }
                                                onChange={ (e) => setPassword(e.target.value) }
                                                style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                                            />
                                            <button
                                                type="button"
                                                onClick={ () => setShowPassword(!showPassword) }
                                                className="show_pwd"
                                                style={{ color: C.muted }}
                                            >
                                                { showPassword ? t("login.hide") : t("login.show") }
                                            </button>
                                        </div>
                                        <p className={ styles.passwordHint } style={{ color: C.faint }}>{ t("forgot.passwordHint") }</p>
                                    </div>
                                    <div>
                                        <label className="form_label" style={{ color: C.muted }}>{ t("forgot.confirmPassword") }</label>
                                        <input
                                            className="input"
                                            type="password"
                                            placeholder="••••••••••"
                                            value={ passwordConfirm }
                                            onChange={ (e) => setPasswordConfirm(e.target.value) }
                                            style={{ border: `1.5px solid ${C.border}`, color: C.base }}
                                        />
                                    </div>
                                    { 
                                        error && 
                                        <p className="error">{ error }</p> 
                                    }
                                    {
                                        password && passwordConfirm && password !== passwordConfirm &&
                                        <p className="error">{ t("forgot.passwordMismatch") }</p>
                                    }
                                    <button
                                        onClick={ handleResetPassword }
                                        disabled={ !passwordValid || password !== passwordConfirm || loading }
                                        className="btn"
                                        style={{ 
                                            background: !passwordValid || password !== passwordConfirm || loading ? "#ccc" : C.accent, 
                                            cursor: !passwordValid || password !== passwordConfirm || loading ? "not-allowed" : "pointer", 
                                            color: C.base 
                                        }}
                                    >
                                        { loading ? "..." : t("forgot.savePassword") }
                                    </button>
                                </div>
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