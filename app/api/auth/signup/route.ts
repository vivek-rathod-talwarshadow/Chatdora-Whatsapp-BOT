import { NextResponse } from "next/server";

import {
  buildVerificationEmail,
  createOrRefreshVerificationToken,
  findAuthUserByEmail,
  getVerificationResendCooldown
} from "@/lib/auth/email-verification";
import { sendEmail } from "@/lib/email/smtp";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type SignupBody = {
  email?: string;
  fullName?: string;
  password?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = normalizeEmail(body.email ?? "");
    const fullName = (body.fullName ?? "").trim();
    const password = body.password ?? "";

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let user = await findAuthUserByEmail(email);

    if (user?.email_confirmed_at) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName
        }
      });

      if (error || !data.user) {
        return NextResponse.json({ error: error?.message || "Unable to create your account." }, { status: 400 });
      }

      user = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: {
          full_name: fullName
        }
      };
    } else {
      const retryAfterSeconds = await getVerificationResendCooldown(user.id);
      if (retryAfterSeconds > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${retryAfterSeconds} seconds before sending another verification email.`,
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

      const { error: updateUserError } = await admin.auth.admin.updateUserById(user.id, {
        password,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          full_name: fullName
        }
      });

      if (updateUserError) {
        return NextResponse.json({ error: updateUserError.message }, { status: 400 });
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        email
      });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }

    const { rawToken, verificationUrl } = await createOrRefreshVerificationToken(user.id, email);
    const emailContent = buildVerificationEmail({
      fullName,
      verificationUrl
    });

    const delivery = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    console.log("Signup verification email sent", {
      email,
      provider: delivery.provider,
      messageId: delivery.messageId
    });

    return NextResponse.json({
      message: "Account created. Check your inbox to verify your email.",
      email,
      messageId: delivery.messageId,
      retryAfterSeconds: 60,
      preview_token: process.env.NODE_ENV === "development" ? rawToken : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create your account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
