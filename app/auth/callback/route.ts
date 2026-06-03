import { NextResponse } from "next/server";

import { clearGoogleOAuthStateCookie, readGoogleOAuthStateCookie, setAppSessionCookie } from "@/lib/auth/app-session";
import { findAuthUserByEmail } from "@/lib/auth/email-verification";
import { exchangeGoogleCodeForUserInfo, getSafeNextPath } from "@/lib/auth/google-oauth";
import { getAppUrl } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function redirectToLogin(reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, getAppUrl()));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const stateCookie = await readGoogleOAuthStateCookie();

  if (!code || !returnedState || !stateCookie || stateCookie.payload.nonce !== returnedState) {
    return redirectToLogin("google_oauth");
  }

  try {
    const baseUrl = getAppUrl();
    const nextPath = getSafeNextPath(stateCookie.payload.next);
    const { email, fullName } = await exchangeGoogleCodeForUserInfo(code);
    const admin = getSupabaseAdmin();
    let user = await findAuthUserByEmail(email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          provider: "google"
        }
      });

      if (error || !data.user) {
        throw new Error(error?.message || "Unable to create your Google account.");
      }

      user = data.user;
    } else {
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          full_name: fullName ?? user.user_metadata?.full_name ?? null,
          provider: "google"
        }
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      email,
      full_name: fullName
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const response = NextResponse.redirect(new URL(nextPath, baseUrl));
    await setAppSessionCookie(response, {
      createdAt: user.created_at ?? new Date().toISOString(),
      email,
      fullName,
      id: user.id
    });
    clearGoogleOAuthStateCookie(response);

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return redirectToLogin("google_oauth");
  }
}
