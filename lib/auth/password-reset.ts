import "server-only";

import crypto from "crypto";

import { getAppUrl } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PASSWORD_RESET_TTL_HOURS = 2;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getPublicAppUrl() {
  return getAppUrl().replace(/\/$/, "");
}

function getPasswordResetUrl(token: string) {
  const baseUrl = getPublicAppUrl();
  return new URL(`/reset-password?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function createPasswordResetToken(userId: string, email: string) {
  const admin = getSupabaseAdmin();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { error: cleanupError } = await admin.from("password_reset_tokens").delete().eq("user_id", userId);
  if (cleanupError) {
    throw cleanupError;
  }

  const { error } = await admin.from("password_reset_tokens").insert({
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
    resetUrl: getPasswordResetUrl(rawToken)
  };
}

export async function validatePasswordResetToken(rawToken: string) {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { data: tokenRow, error } = await admin
    .from("password_reset_tokens")
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

  return {
    ok: true as const,
    tokenId: tokenRow.id,
    userId: tokenRow.user_id,
    email: tokenRow.email
  };
}

export async function consumePasswordResetToken(rawToken: string, newPassword: string) {
  const admin = getSupabaseAdmin();
  const validation = await validatePasswordResetToken(rawToken);

  if (!validation.ok) {
    return validation;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(validation.userId, {
    password: newPassword
  });

  if (updateError) {
    throw updateError;
  }

  const consumedAt = new Date().toISOString();
  const { error: markError } = await admin
    .from("password_reset_tokens")
    .update({ consumed_at: consumedAt })
    .eq("id", validation.tokenId);

  if (markError) {
    throw markError;
  }

  return { ok: true as const, email: validation.email };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPasswordResetEmail({
  fullName,
  resetUrl
}: {
  fullName?: string;
  resetUrl: string;
}) {
  const name = fullName?.trim() || "there";
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your ChatDora password",
    text:
      `Hi ${name},\n\n` +
      `We received a request to reset your ChatDora password.\n` +
      `Open this link to choose a new password:\n${resetUrl}\n\n` +
      `This link expires in 2 hours.\n`,
    html: `
      <div style="margin:0;padding:24px;background:#f3f7f2;font-family:Arial,sans-serif;color:#173321;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbe7dc;border-radius:20px;">
          <tr>
            <td style="padding:32px;">
              <div style="font-size:24px;font-weight:700;color:#10261a;">ChatDora</div>
              <div style="margin-top:4px;font-size:12px;color:#52705d;">AI WhatsApp Bot</div>
              <div style="margin-top:18px;display:inline-block;padding:8px 14px;border-radius:999px;background:#e7f6ea;color:#185c37;font-size:12px;font-weight:700;">
                Password Reset
              </div>
              <h1 style="margin:20px 0 12px;font-size:28px;line-height:1.25;color:#10261a;">Reset your password</h1>
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Hi ${safeName}, we received a request to reset your ChatDora password.</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">Click the button below to choose a new password and get back into your dashboard.</p>
              <p style="margin:0 0 24px;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1f8f4d;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:16px;font-weight:700;">Reset Password</a>
              </p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#52705d;">This link expires in 2 hours.</p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6c8574;">If the button does not work, open this link:</p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.7;word-break:break-all;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#1f8f4d;text-decoration:underline;">${safeUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e4ece5;margin:0 0 20px;" />
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#52705d;">If you did not request this, you can safely ignore this email.</p>
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
