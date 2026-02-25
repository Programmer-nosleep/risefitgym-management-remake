import nodemailer from "nodemailer";
import { env } from "../src/config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const host = env.smtp.host;
  const port = env.smtp.port;
  const user = env.smtp.user;
  const pass = env.smtp.pass;

  if (!host || !port) return null;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: env.smtp.secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransport;
}

export async function sendEmail(input: SendEmailInput) {
  const transport = getTransport();

  if (!transport) {
    console.log(`[email:dev] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return { mode: "console" as const };
  }

  await transport.sendMail({
    from: env.smtp.from ?? "no-reply@risefit.local",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { mode: "smtp" as const };
}

