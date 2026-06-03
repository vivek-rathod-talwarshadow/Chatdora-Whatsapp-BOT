import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  type AppSessionUser,
  buildAppSessionValue,
  parseAppSessionValue,
  parseGoogleOAuthStateValue as parseGoogleOAuthStateValueToken,
  buildGoogleOAuthStateValue as buildGoogleOAuthStateValueToken,
  signGoogleOAuthStatePayload
} from "@/lib/auth/session-token";

const APP_SESSION_COOKIE = "chatdora_app_session";
const GOOGLE_OAUTH_STATE_COOKIE = "chatdora_google_oauth_state";
const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function getAppSessionUserFromCookies() {
  return parseAppSessionValue(cookies().get(APP_SESSION_COOKIE)?.value);
}

export async function setAppSessionCookie(response: NextResponse, user: AppSessionUser) {
  response.cookies.set(APP_SESSION_COOKIE, await buildAppSessionValue(user), getCookieOptions(APP_SESSION_MAX_AGE_SECONDS));
}

export function clearAppSessionCookie(response: NextResponse) {
  response.cookies.set(APP_SESSION_COOKIE, "", {
    ...getCookieOptions(0),
    expires: new Date(0)
  });
}

export function clearAppSessionCookieStore() {
  cookies().set(APP_SESSION_COOKIE, "", {
    ...getCookieOptions(0),
    expires: new Date(0)
  });
}

export async function createGoogleOAuthState(next: string) {
  const nonce = crypto.randomBytes(24).toString("hex");
  const payload = { next, nonce };
  const signature = await signGoogleOAuthStatePayload(payload);
  const cookieValue = await buildGoogleOAuthStateValueToken({
    payload,
    signature
  });

  return {
    cookieValue,
    state: nonce
  };
}

export function readGoogleOAuthStateCookie() {
  return parseGoogleOAuthStateValueToken(cookies().get(GOOGLE_OAUTH_STATE_COOKIE)?.value);
}

export function setGoogleOAuthStateCookie(response: NextResponse, cookieValue: string) {
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, cookieValue, getCookieOptions(GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS));
}

export function clearGoogleOAuthStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    ...getCookieOptions(0),
    expires: new Date(0)
  });
}
