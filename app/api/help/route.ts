import { NextResponse } from "next/server";

import { OWNER_SUPER_ADMIN_EMAIL } from "@/lib/admin";
import {
  CHATDORA_CONTACT_EMAIL,
  CHATDORA_HELP_EMAIL_SUBJECT,
  CHATDORA_SUPPORT_PHONE,
  CHATDORA_WEBSITE
} from "@/lib/contact";
import { sendEmail } from "@/lib/email/smtp";

type HelpRequestBody = {
  email?: string;
  message?: string;
  name?: string;
  pageUrl?: string;
};

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHelpEmail(body: Required<HelpRequestBody>) {
  const summaryLine = body.pageUrl ? `Page / area: ${body.pageUrl}` : "Page / area: Not provided";

  return {
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#163020;">
        <h2 style="margin:0 0 16px;">New ChatDora help request</h2>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(body.name)}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p style="margin:0 0 8px;"><strong>${escapeHtml(summaryLine)}</strong></p>
        <p style="margin:16px 0 8px;"><strong>Issue details</strong></p>
        <div style="white-space:pre-wrap;border:1px solid #d4e7d9;border-radius:12px;padding:16px;background:#f7fbf8;">${escapeHtml(body.message)}</div>
        <p style="margin:16px 0 0;font-size:13px;color:#4d6653;">Sent from ${CHATDORA_WEBSITE}</p>
      </div>
    `,
    text: [
      "New ChatDora help request",
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      summaryLine,
      "",
      "Issue details:",
      body.message,
      "",
      `Sent from ${CHATDORA_WEBSITE}`
    ].join("\n")
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as HelpRequestBody;
    const name = normalize(payload.name);
    const email = normalize(payload.email).toLowerCase();
    const pageUrl = normalize(payload.pageUrl);
    const message = normalize(payload.message);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and issue details are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const emailBody = buildHelpEmail({
      email,
      message,
      name,
      pageUrl
    });

    await sendEmail({
      to: CHATDORA_CONTACT_EMAIL,
      subject: `${CHATDORA_HELP_EMAIL_SUBJECT} - ${name}`,
      html: emailBody.html,
      text: emailBody.text
    });

    if (OWNER_SUPER_ADMIN_EMAIL.toLowerCase() !== CHATDORA_CONTACT_EMAIL.toLowerCase()) {
      await sendEmail({
        to: OWNER_SUPER_ADMIN_EMAIL,
        subject: `${CHATDORA_HELP_EMAIL_SUBJECT} - ${name}`,
        html: emailBody.html,
        text: emailBody.text
      });
    }

    return NextResponse.json({
      message: `Thanks. Your request has been sent to ${CHATDORA_CONTACT_EMAIL}. You can also call ${CHATDORA_SUPPORT_PHONE}.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send help request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
