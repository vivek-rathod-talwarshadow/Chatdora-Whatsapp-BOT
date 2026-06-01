import "server-only";

import crypto from "crypto";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

const EMAIL_VERIFICATION_TTL_HOURS = 24;

type AuthUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
  id: string;
  user_metadata?: {
    full_name?: string;
  };
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getPublicAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

function getVerificationUrl(token: string) {
  const baseUrl = getPublicAppUrl();
  return new URL(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function findAuthUserByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(email);
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((entry) => normalizeEmail(entry.email ?? "") === normalizedEmail);

    if (user) {
      return user as AuthUser;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

export async function createOrRefreshVerificationToken(userId: string, email: string) {
  const admin = getSupabaseAdmin();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { error: cleanupError } = await admin
    .from("email_verification_tokens")
    .delete()
    .eq("user_id", userId);

  if (cleanupError) {
    throw cleanupError;
  }

  const { error } = await admin.from("email_verification_tokens").insert({
    user_id: userId,
    email: normalizeEmail(email),
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  if (error) {
    throw error;
  }

  return {
    rawToken,
    verificationUrl: getVerificationUrl(rawToken)
  };
}

export async function consumeVerificationToken(rawToken: string) {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { data: tokenRow, error } = await admin
    .from("email_verification_tokens")
    .select("id, user_id, email, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!tokenRow || tokenRow.consumed_at) {
    return { ok: false as const, reason: "invalid" };
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired", email: tokenRow.email };
  }

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(tokenRow.user_id);

  if (authUserError) {
    throw authUserError;
  }

  if (!authUser.user) {
    return { ok: false as const, reason: "invalid" };
  }

  if (!authUser.user.email_confirmed_at) {
    const { error: updateError } = await admin.auth.admin.updateUserById(tokenRow.user_id, {
      email_confirm: true
    });

    if (updateError) {
      throw updateError;
    }
  }

  const consumedAt = new Date().toISOString();

  const { error: markError } = await admin
    .from("email_verification_tokens")
    .update({ consumed_at: consumedAt })
    .eq("id", tokenRow.id);

  if (markError) {
    throw markError;
  }

  return { ok: true as const, email: tokenRow.email };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildVerificationEmail({
  fullName,
  verificationUrl
}: {
  fullName?: string;
  verificationUrl: string;
}) {
  const name = fullName?.trim() || "there";
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);

  return {
    subject: "Verify your ChatDora account",
    text: `Hi ${name},\n\nWelcome to ChatDora. Verify your email to activate your account:\n${verificationUrl}\n\nThis link expires in 24 hours.\n`,
    html: `
      <div style="margin:0;padding:24px;background:#f3f7f2;font-family:Arial,sans-serif;color:#173321;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbe7dc;border-radius:20px;">
          <tr>
            <td style="padding:32px;">
              <div style="font-size:24px;font-weight:700;color:#10261a;">ChatDora</div>
              <div style="margin-top:4px;font-size:12px;color:#52705d;">AI WhatsApp Bot</div>
              <div style="margin-top:18px;display:inline-block;padding:8px 14px;border-radius:999px;background:#e7f6ea;color:#185c37;font-size:12px;font-weight:700;">
                ChatDora Account Setup
              </div>
              <h1 style="margin:20px 0 12px;font-size:28px;line-height:1.25;color:#10261a;">Verify your email</h1>
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${safeName}, your ChatDora account is almost ready.</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">Click the button below to confirm your email address and start managing your WhatsApp FAQ bot.</p>
              <p style="margin:0 0 24px;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1f8f4d;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:700;">Verify Email</a>
              </p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#52705d;">This link expires in 24 hours.</p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6c8574;">If the button does not work, open this link:</p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.7;word-break:break-all;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#1f8f4d;text-decoration:underline;">${safeUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e4ece5;margin:0 0 20px;" />
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#52705d;">Need help? Contact the ChatDora team.</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#1f8f4d;">
                <a href="mailto:contactus@chatdora.in" style="color:#1f8f4d;text-decoration:none;">contactus@chatdora.in</a> |
                <a href="tel:+917622858519" style="color:#1f8f4d;text-decoration:none;">7622858519</a> |
                <a href="https://chatdora.in" target="_blank" rel="noopener noreferrer" style="color:#1f8f4d;text-decoration:none;">chatdora.in</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
}
