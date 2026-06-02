import type { ReactNode } from "react";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Badge } from "@/components/ui/badge";

type PublicPageShellProps = {
  badge?: string;
  children: ReactNode;
  description: string;
  title: string;
};

export function PublicPageShell({ badge = "ChatDora", children, description, title }: PublicPageShellProps) {
  return (
    <main className="min-h-screen bg-hero-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6">
        <header className="flex items-center justify-between rounded-[2rem] border border-border/60 bg-white/80 p-4 shadow-card backdrop-blur dark:bg-card/80">
          <AppLogo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Back to home
            </Link>
          </div>
        </header>

        <section className="flex-1 py-10">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4 rounded-[2rem] border border-border/70 bg-card/80 p-7 shadow-card">
              <Badge className="w-fit">{badge}</Badge>
              <div className="space-y-3">
                <h1 className="font-[var(--font-sora)] text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
                <p className="max-w-3xl text-base text-muted-foreground md:text-lg">{description}</p>
              </div>
            </div>

            {children}
          </div>
        </section>

        <PublicFooter />
      </div>
    </main>
  );
}
