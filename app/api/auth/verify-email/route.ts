import { NextResponse } from "next/server";

import { consumeVerificationToken } from "@/lib/auth/email-verification";
import { getAppUrl } from "@/lib/config";

function buildRedirectUrl(status: "success" | "invalid" | "expired", email?: string) {
  const baseUrl = getAppUrl();
  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("status", status);

  if (email) {
    url.searchParams.set("email", email);
  }

  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(buildRedirectUrl("invalid"));
  }

  try {
    const result = await consumeVerificationToken(token);

    if (!result.ok) {
      if (result.reason === "expired") {
        return NextResponse.redirect(buildRedirectUrl("expired", result.email));
      }

      return NextResponse.redirect(buildRedirectUrl("invalid"));
    }

    return NextResponse.redirect(buildRedirectUrl("success", result.email));
  } catch {
    return NextResponse.redirect(buildRedirectUrl("invalid"));
  }
}
