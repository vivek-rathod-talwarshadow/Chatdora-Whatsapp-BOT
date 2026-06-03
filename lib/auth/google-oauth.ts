import "server-only";

import { NextResponse } from "next/server";

import {
  clearGoogleOAuthStateCookie,
  createGoogleOAuthState,
  setGoogleOAuthStateCookie
} from "@/lib/auth/app-session";
import { getAppUrl } from "@/lib/config";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is required.");
  }

  return clientId;
}

function getGoogleClientSecret() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is required.");
  }

  return clientSecret;
}

export function getGoogleOAuthRedirectUri() {
  return `${getAppUrl().replace(/\/$/, "")}/auth/callback`;
}

export function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function buildGoogleOAuthStartResponse(nextPath: string) {
  const response = NextResponse.redirect("https://accounts.google.com/o/oauth2/v2/auth");
  const { cookieValue, state } = await createGoogleOAuthState(nextPath);
  const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  redirectUrl.searchParams.set("client_id", getGoogleClientId());
  redirectUrl.searchParams.set("redirect_uri", getGoogleOAuthRedirectUri());
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", "openid email profile");
  redirectUrl.searchParams.set("access_type", "offline");
  redirectUrl.searchParams.set("prompt", "select_account");
  redirectUrl.searchParams.set("state", state);

  response.headers.set("Location", redirectUrl.toString());
  setGoogleOAuthStateCookie(response, cookieValue);

  return response;
}

export async function exchangeGoogleCodeForUserInfo(code: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleOAuthRedirectUri()
    })
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Google token exchange failed.");
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });
  const profile = (await profileResponse.json()) as GoogleUserInfo;

  if (!profileResponse.ok || !profile.email) {
    throw new Error("Google account details could not be loaded.");
  }

  if (!profile.email_verified) {
    throw new Error("Your Google email address is not verified.");
  }

  return {
    email: profile.email.trim().toLowerCase(),
    fullName: profile.name?.trim() || null
  };
}

export function clearGoogleOAuthState(response: NextResponse) {
  clearGoogleOAuthStateCookie(response);
}
