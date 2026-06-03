"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordFormProps = {
  token?: string;
  tokenStatus: "ready" | "invalid";
};

export function ResetPasswordForm({ token = "", tokenStatus }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  async function updatePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        password
      })
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      toast.error(payload.error || "Unable to update password.");
      return;
    }

    toast.success(payload.message || "Password updated successfully.");
    router.push("/login?reset=1");
    router.refresh();
  }

  const disabled = tokenStatus !== "ready" || isPending;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          {tokenStatus === "ready"
            ? "Choose a new password for your ChatDora account."
            : "This password reset link is invalid or has expired."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tokenStatus === "invalid" ? (
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request a new reset link</Link>
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form
            action={() => {
              startTransition(() => {
                void updatePassword();
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                disabled={disabled}
              />
            </div>
            <Button type="submit" className="w-full" disabled={disabled}>
              {isPending ? "Updating..." : "Update password"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
