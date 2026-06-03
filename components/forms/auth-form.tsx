"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppUrl } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  defaultEmail?: string;
  mode: "login" | "signup";
  verificationMode?: boolean;
};

export function AuthForm({ mode, defaultEmail = "", verificationMode = false }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldownSeconds]);

  async function onSubmit(formData: FormData) {
    if (verificationMode && mode !== "login") {
      await resendVerificationEmail();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const emailValue = String(formData.get("email") ?? "");
    const passwordValue = String(formData.get("password") ?? "");
    const nameValue = String(formData.get("fullName") ?? "");

    if (mode === "signup") {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue,
          fullName: nameValue
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error(payload.error || "Unable to create your account.");
        return;
      }

      toast.success(payload.message || "Account created. Check your inbox to verify your email.");
      router.push(`/verify-email?email=${encodeURIComponent(emailValue)}`);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome back to ChatDora.");
    router.push("/dashboard");
    router.refresh();
  }

  async function continueWithGoogle() {
    setIsGoogleLoading(true);
    window.location.href = `${getAppUrl()}/api/auth/google?next=${encodeURIComponent("/dashboard")}`;
  }

  async function resendVerificationEmail() {
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    if (resendCooldownSeconds > 0) {
      toast.error(`Please wait ${resendCooldownSeconds}s before sending another email.`);
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string; retryAfterSeconds?: number };

      if (!response.ok) {
        if (payload.retryAfterSeconds) {
          setResendCooldownSeconds(payload.retryAfterSeconds);
        }
        toast.error(payload.error || "Unable to resend verification email.");
        return;
      }

      setResendCooldownSeconds(60);
      toast.success(payload.message || "Verification email sent.");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } finally {
      setIsResending(false);
    }
  }

  function getResendButtonLabel() {
    if (isResending) {
      return "Sending...";
    }

    if (resendCooldownSeconds > 0) {
      return `Resend in ${String(Math.floor(resendCooldownSeconds / 60)).padStart(2, "0")}:${String(resendCooldownSeconds % 60).padStart(2, "0")}`;
    }

    return "Resend verification email";
  }

  const primaryButtonLabel = verificationMode
    ? isPending
      ? "Please wait..."
      : resendCooldownSeconds > 0
        ? `Send again in ${String(Math.floor(resendCooldownSeconds / 60)).padStart(2, "0")}:${String(resendCooldownSeconds % 60).padStart(2, "0")}`
        : "Send verification email"
    : isPending
      ? "Please wait..."
      : mode === "login"
        ? "Login"
        : "Create account";

  const cardDescription = verificationMode
    ? "Use your inbox to verify your account, or request a fresh email below."
    : "Start free with 100 messages/month. Upgrade to Plus for FAQs, CRM, contacts, and logs.";

  const cardTitle =
    mode === "login" ? "Login to ChatDora" : verificationMode ? "Resend verification email" : "Create your ChatDora account";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {!verificationMode ? (
          <>
            <Button type="button" variant="outline" className="w-full" disabled={isGoogleLoading || isPending} onClick={continueWithGoogle}>
              <GoogleIcon />
              {isGoogleLoading ? "Connecting..." : mode === "login" ? "Continue with Google" : "Sign up with Google"}
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}
        <form
          action={(formData) => {
            startTransition(() => {
              void onSubmit(formData);
            });
          }}
          className="space-y-4"
        >
          {mode === "signup" && !verificationMode ? (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Vivek Patel"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contactus@chatdora.in"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {mode === "login" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"} className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          ) : verificationMode ? null : (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending || (verificationMode && resendCooldownSeconds > 0)}>
            {primaryButtonLabel}
          </Button>
          {mode === "login" ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isResending || resendCooldownSeconds > 0}
              onClick={resendVerificationEmail}
            >
              {getResendButtonLabel()}
            </Button>
          ) : null}
          {!verificationMode ? (
            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-primary hover:underline">
                {mode === "login" ? "Register / Sign up" : "Login"}
              </Link>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path
        d="M21.81 12.23c0-.72-.06-1.25-.19-1.8H12.2v3.56h5.53c-.11.88-.72 2.2-2.08 3.09l-.02.12 3 2.28.21.02c1.94-1.76 3.06-4.34 3.06-7.27Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 22c2.71 0 4.98-.88 6.64-2.39l-3.17-2.42c-.85.58-1.99.98-3.47.98-2.65 0-4.9-1.76-5.7-4.19l-.12.01-3.12 2.37-.04.11A10.03 10.03 0 0 0 12.2 22Z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.98a6.1 6.1 0 0 1-.33-1.98c0-.69.12-1.35.31-1.98l-.01-.13-3.16-2.41-.1.05A9.85 9.85 0 0 0 2.08 12c0 1.58.38 3.08 1.05 4.4l3.37-2.42Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.83c1.87 0 3.13.79 3.85 1.45l2.81-2.69C17.16 3.02 14.91 2 12.2 2a10.03 10.03 0 0 0-8.98 5.53l3.27 2.49c.81-2.43 3.06-4.19 5.71-4.19Z"
        fill="#EA4335"
      />
    </svg>
  );
}
