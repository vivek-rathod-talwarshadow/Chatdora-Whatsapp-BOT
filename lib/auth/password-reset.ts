import "server-only";

import crypto from "crypto";

import { getAppUrl } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PASSWORD_RESET_TTL_HOURS = 2;

type PasswordResetPayload = {
  email: string;
  exp: number;
  iat: number;
  uid: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordResetSecret() {
  return process.env.PASSWORD_RESET_SECRET?.trim() || process.env.APP_SESSION_SECRET?.trim() || "";
}

function getPublicAppUrl() {
  return getAppUrl().replace(/\/$/, "");
}

function getPasswordResetUrl(token: string) {
  const baseUrl = getPublicAppUrl();
  return new URL(`/reset-password?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  const secret = getPasswordResetSecret();

  if (!secret) {
    throw new Error("PASSWORD_RESET_SECRET or APP_SESSION_SECRET is required.");
  }

  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function buildPasswordResetToken(payload: PasswordResetPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function parsePasswordResetToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as PasswordResetPayload;
  } catch {
    return null;
  }
}

export async function createPasswordResetToken(userId: string, email: string) {
  const issuedAt = Date.now();
  const payload: PasswordResetPayload = {
    email: normalizeEmail(email),
    exp: issuedAt + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000,
    iat: issuedAt,
    uid: userId
  };
  const rawToken = buildPasswordResetToken(payload);

  return {
    rawToken,
    resetUrl: getPasswordResetUrl(rawToken)
  };
}

export async function validatePasswordResetToken(rawToken: string) {
  const admin = getSupabaseAdmin();
  const payload = parsePasswordResetToken(rawToken);

  if (!payload) {
    return { ok: false as const, reason: "invalid" };
  }

  if (payload.exp < Date.now()) {
    return { ok: false as const, reason: "expired", email: payload.email };
  }

  const { data, error } = await admin.auth.admin.getUserById(payload.uid);

  if (error) {
    throw error;
  }

  const user = data.user;
  if (!user || normalizeEmail(user.email ?? "") !== payload.email) {
    return { ok: false as const, reason: "invalid" };
  }

  const userUpdatedAtMs = user.updated_at ? new Date(user.updated_at).getTime() : 0;
  if (Number.isFinite(userUpdatedAtMs) && userUpdatedAtMs > payload.iat) {
    return { ok: false as const, reason: "expired", email: payload.email };
  }

  return {
    ok: true as const,
    email: payload.email,
    userId: payload.uid
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
