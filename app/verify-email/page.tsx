import type { Metadata } from "next";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AuthForm } from "@/components/forms/auth-form";
import { PublicFooter } from "@/components/marketing/public-footer";

export const metadata: Metadata = {
  title: "Verify Email",
  robots: {
    index: false,
    follow: false
  }
};

type VerifyEmailPageProps = {
  searchParams?: {
    email?: string;
    status?: string;
  };
};

function getCopy(status?: string) {
  if (status === "success") {
    return {
      badge: "Email verified",
      title: "Your account is ready.",
      description: "Your email has been confirmed. You can log in and start using ChatDora now."
    };
  }

  if (status === "expired") {
    return {
      badge: "Link expired",
      title: "Your verification link has expired.",
      description: "Request a fresh verification email below and we will send you a new secure link."
    };
  }

  if (status === "invalid") {
    return {
      badge: "Invalid link",
      title: "This verification link is not valid.",
      description: "If you still need access, request a new verification email using the same address you signed up with."
    };
  }

  return {
    badge: "Check your inbox",
    title: "Verify your email to finish signup.",
    description: "We have sent a custom confirmation email for your ChatDora account. Open it and click the verification button."
  };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const status = searchParams?.status;
  const email = searchParams?.email;
  const copy = getCopy(status);
  const isSuccess = status === "success";

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
                {copy.badge}
              </div>
              <h1 className="max-w-xl font-[var(--font-sora)] text-4xl font-semibold leading-tight md:text-5xl">
                {copy.title}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">{copy.description}</p>
              {email ? <p className="text-sm text-muted-foreground">Email: {email}</p> : null}
              {isSuccess ? (
                <div className="text-sm text-muted-foreground">
                  Continue to{" "}
                  <Link
                    href={email ? `/login?email=${encodeURIComponent(email)}&verified=1` : "/login?verified=1"}
                    className="font-medium text-primary"
                  >
                    Login
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="flex justify-center lg:justify-end">
              <AuthForm mode={isSuccess ? "login" : "signup"} defaultEmail={email ?? ""} verificationMode={!isSuccess} />
            </div>
          </div>
        </section>
        <PublicFooter />
      </div>
    </main>
  );
}
