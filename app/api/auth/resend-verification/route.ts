import { NextResponse } from "next/server";

import {
  buildVerificationEmail,
  createOrRefreshVerificationToken,
  findAuthUserByEmail,
  getVerificationResendCooldown
} from "@/lib/auth/email-verification";
import { sendEmail } from "@/lib/email/smtp";

type ResendBody = {
  email?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResendBody;
    const email = normalizeEmail(body.email ?? "");

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await findAuthUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "No account was found for this email." }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ error: "This email is already verified. Please log in." }, { status: 409 });
    }

    const retryAfterSeconds = await getVerificationResendCooldown(user.id);
    if (retryAfterSeconds > 0) {
      return NextResponse.json(
        {
          error: `Please wait ${retryAfterSeconds} seconds before resending the verification email.`,
          retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds)
          }
        }
      );
    }

    const { verificationUrl } = await createOrRefreshVerificationToken(user.id, email);
    const emailContent = buildVerificationEmail({
      fullName: user.user_metadata?.full_name,
      verificationUrl
    });

    const delivery = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    console.log("Verification email resent", {
      email,
      provider: delivery.provider,
      messageId: delivery.messageId
    });

    return NextResponse.json({
      message: "Verification email sent.",
      messageId: delivery.messageId,
      retryAfterSeconds: 60
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resend verification email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
