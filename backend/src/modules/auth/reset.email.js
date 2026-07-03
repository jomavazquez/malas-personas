import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    environment: BrevoEnvironment.Production,
});

const texts = {
    es: {
        subject: (code) => `[Malas Personas] Tu código de verificación: ${ code }`,
        greeting: (username) => `Hola, ${ username } 👋`,
        intro: "Recibiste este email porque solicitaste restablecer tu contraseña en Malas Personas.",
        codeLabel: "Tu código de verificación es:",
        expiry: "Caduca en <strong>10 minutos</strong>.",
        ignore: "Si no fuiste tú, ignora este email.",
    },
    en: {
        subject: (code) => `[Malas Personas] Your verification code: ${ code }`,
        greeting: (username) => `Hi, ${ username } 👋`,
        intro: "You received this email because you requested a password reset on Malas Personas.",
        codeLabel: "Your verification code is:",
        expiry: "Expires in <strong>10 minutes</strong>.",
        ignore: "If this wasn't you, just ignore this email.",
    },
};

export const sendResetCodeEmail = async({ email, username, code, lang = "es" }) => {
    const t = texts[lang] ?? texts.es;
    return client.transactionalEmails.sendTransacEmail({
        subject: t.subject(code),
        htmlContent: `
            <h2>${ t.greeting(username) }</h2>
            <p>${ t.intro }</p>
            <p>${ t.codeLabel }</p>
            <h1 style="letter-spacing: 8px; font-size: 48px;">${ code }</h1>
            <p>${ t.expiry }</p>
            <p>${ t.ignore }</p>
        `,
        sender: { name: "Malas Personas", email: process.env.CONTACT_EMAIL },
        to: [{ email }],
    });
};