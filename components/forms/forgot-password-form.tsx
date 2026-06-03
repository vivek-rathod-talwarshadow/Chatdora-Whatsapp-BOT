"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordFormProps = {
  defaultEmail?: string;
};

export function ForgotPasswordForm({ defaultEmail = "" }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  async function sendResetLink() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.error("Enter your email first.");
      return;
    }

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: normalizedEmail
      })
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      toast.error(payload.error || "Unable to send reset link.");
      return;
    }

    toast.success(payload.message || "Password reset email sent.");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>Enter your email and we will send you a secure password reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={() => {
            startTransition(() => {
              void sendResetLink();
            });
          }}
          className="space-y-4"
        >
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"} className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
