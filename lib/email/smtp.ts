import "server-only";

import { getRequiredEnv } from "@/lib/env";

const HARDCODED_EMAIL_FROM = "contactus@chatdora.in";
const HARDCODED_EMAIL_FROM_NAME = "Chatdora";

type SendEmailOptions = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

type SendEmailResult = {
  messageId?: string;
  provider: "brevo" | "resend";
};

function getFromAddress() {
  const fromEmail = process.env.EMAIL_FROM_EMAIL?.trim() || HARDCODED_EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || HARDCODED_EMAIL_FROM_NAME;
  return `"${fromName.replace(/"/g, "")}" <${fromEmail}>`;
}

async function sendWithBrevo({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": getRequiredEnv("BREVO_API_KEY"),
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: process.env.EMAIL_FROM_EMAIL?.trim() || HARDCODED_EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME?.trim() || HARDCODED_EMAIL_FROM_NAME
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo email send failed: ${errorText || response.statusText}`);
  }

  const payload = (await response.json()) as { messageId?: string };
  return {
    provider: "brevo",
    messageId: payload.messageId
  };
}

async function sendWithResend({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRequiredEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email send failed: ${errorText || response.statusText}`);
  }

  const payload = (await response.json()) as { id?: string };
  return {
    provider: "resend",
    messageId: payload.id
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (process.env.BREVO_API_KEY) {
    return sendWithBrevo(options);
  }

  if (process.env.RESEND_API_KEY) {
    return sendWithResend(options);
  }

  throw new Error("Missing email provider configuration. Set BREVO_API_KEY or RESEND_API_KEY.");
}
