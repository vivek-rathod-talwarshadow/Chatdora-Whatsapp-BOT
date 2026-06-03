import { NextResponse } from "next/server";

import { findAuthUserByEmail } from "@/lib/auth/email-verification";
import { buildPasswordResetEmail, createPasswordResetToken } from "@/lib/auth/password-reset";
import { sendEmail } from "@/lib/email/smtp";

type ForgotPasswordBody = {
  email?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ForgotPasswordBody;
    const email = normalizeEmail(body.email ?? "");

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await findAuthUserByEmail(email);

    if (user?.email_confirmed_at) {
      const { resetUrl, rawToken } = await createPasswordResetToken(user.id, email);
      const emailContent = buildPasswordResetEmail({
        fullName: user.user_metadata?.full_name,
        resetUrl
      });

      const delivery = await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      console.log("Password reset email sent", {
        email,
        provider: delivery.provider,
        messageId: delivery.messageId
      });

      return NextResponse.json({
        message: "If an account exists for this email, a password reset link has been sent.",
        messageId: delivery.messageId,
        preview_token: process.env.NODE_ENV === "development" ? rawToken : undefined
      });
    }

    return NextResponse.json({
      message: "If an account exists for this email, a password reset link has been sent."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send password reset email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
