"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  async function onSubmit(formData: FormData) {
    if (verificationMode) {
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

  async function resendVerificationEmail() {
    if (!email.trim()) {
      toast.error("Enter your email first.");
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

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error(payload.error || "Unable to resend verification email.");
        return;
      }

      toast.success(payload.message || "Verification email sent.");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } finally {
      setIsResending(false);
    }
  }

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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Please wait..." : mode === "login" ? "Login" : verificationMode ? "Send verification email" : "Create account"}
          </Button>
          {mode === "login" ? (
            <Button type="button" variant="outline" className="w-full" disabled={isResending} onClick={resendVerificationEmail}>
              {isResending ? "Sending..." : "Resend verification email"}
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
