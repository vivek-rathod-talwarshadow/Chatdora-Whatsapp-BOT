import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";
import { PublicFooter } from "@/components/marketing/public-footer";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
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
                Free + Plus ₹899/month
              </div>
              <h1 className="max-w-xl font-[var(--font-sora)] text-4xl font-semibold leading-tight md:text-5xl">
                Reply faster on WhatsApp without losing the human touch.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Run WhatsApp auto-replies on the free plan, then move to Plus when you need FAQs, CRM, contacts, and conversation logs.
              </p>
              <div className="text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/signup" className="font-medium text-primary">
                  Create your account
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AuthForm mode="login" />
            </div>
          </div>
        </section>
        <PublicFooter />
      </div>
    </main>
  );
}
