import { NextResponse } from "next/server";

import { consumePasswordResetToken, validatePasswordResetToken } from "@/lib/auth/password-reset";

type ResetPasswordBody = {
  password?: string;
  token?: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";

    if (!token) {
      return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
    }

    const result = await validatePasswordResetToken(token);

    if (!result.ok) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 400 });
    }

    return NextResponse.json({ valid: true, email: result.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate reset token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const token = (body.token ?? "").trim();
    const password = body.password ?? "";

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const result = await consumePasswordResetToken(token, password);

    if (!result.ok) {
      const status = result.reason === "expired" ? 410 : 400;
      return NextResponse.json({ error: result.reason === "expired" ? "Reset link expired." : "Invalid reset link." }, { status });
    }

    return NextResponse.json({ message: "Password updated successfully.", email: result.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
