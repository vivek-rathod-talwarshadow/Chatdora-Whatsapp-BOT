import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicFooter } from "@/components/marketing/public-footer";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: {
    index: false,
    follow: false
  }
};

type ForgotPasswordPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  return (
    <main className="min-h-screen bg-hero-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6">
        <header className="flex items-center justify-between rounded-[2rem] border border-border/60 bg-white/80 p-4 shadow-card backdrop-blur dark:bg-card/80">
          <AppLogo />
          <ThemeToggle />
        </header>
        <section className="py-8 md:py-10 lg:flex-1 lg:py-12">
          <div className="grid w-full items-start gap-10 lg:min-h-[60vh] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-emerald-900 shadow-sm">
                Account recovery
              </div>
              <h1 className="max-w-xl font-[var(--font-sora)] text-4xl font-semibold leading-tight md:text-5xl">
                Reset your ChatDora password.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                We will email you a secure link so you can choose a new password and get back into your dashboard.
              </p>
              <div className="text-sm text-muted-foreground">
                Need your account instead?{" "}
                <Link href={searchParams?.email ? `/login?email=${encodeURIComponent(searchParams.email)}` : "/login"} className="font-medium text-primary">
                  Go to login
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <ForgotPasswordForm defaultEmail={searchParams?.email ?? ""} />
            </div>
          </div>
        </section>
        <PublicFooter />
      </div>
    </main>
  );
}
