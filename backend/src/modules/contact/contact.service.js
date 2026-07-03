import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  environment: BrevoEnvironment.Production,
});

export const sendContactEmail = async ({ name, email, subject, message }) => {
  return client.transactionalEmails.sendTransacEmail({
    subject: `Malas Personas`,
    htmlContent: `
      <h3>New email from the web</h3>
      <p><strong>Name</strong>: ${ name }</p>
      <p><strong>Email</strong>: ${ email }</p>
      <p><strong>Subject</strong>: ${ subject }</p>
      <p><strong>Message</strong>:</p>
      <p>${ message.replace(/\n/g, "<br>") }</p>
    `,
    sender: { name: "Malas Personas", email: process.env.CONTACT_EMAIL },
    to: [{ email: process.env.CONTACT_EMAIL }],
    replyTo: { email, name },
    bcc: [{ email: process.env.EMAIL_TO }],
  });
};