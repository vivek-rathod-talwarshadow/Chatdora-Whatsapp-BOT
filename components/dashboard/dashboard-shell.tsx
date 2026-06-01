"use client";

import {
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageCircleMore,
  MessagesSquare,
  Phone,
  Settings,
  Shield,
  UserRoundSearch,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { SubmitButton } from "@/components/forms/submit-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { PLUS_PLAN_PRICE_INR } from "@/lib/plans";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/business", label: "Business", icon: Building2 },
  { href: "/dashboard/faqs", label: "FAQs", icon: MessageCircleMore },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: Phone },
  { href: "/dashboard/ai", label: "AI Settings", icon: BrainCircuit },
  { href: "/dashboard/leads", label: "Leads", icon: UserRoundSearch },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessagesSquare },
  { href: "/dashboard/test-bot", label: "Test Bot", icon: Bot },
  { href: "/dashboard/account", label: "My Account", icon: Settings }
];

export function DashboardShell({
  children,
  appHostname,
  signOutAction,
  planName,
  monthlyMessagesRemaining,
  canSeeSuperAdmin
}: {
  children: ReactNode;
  appHostname: string;
  signOutAction: () => Promise<void>;
  planName: string;
  monthlyMessagesRemaining: number | null;
  canSeeSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = canSeeSuperAdmin
    ? [...baseNavigation, { href: "/dashboard/super-admin", label: "Super Admin", icon: Shield }]
    : baseNavigation;
  const mobilePrimaryNavigation = navigation.filter((item) =>
    ["/dashboard", "/dashboard/whatsapp", "/dashboard/ai", "/dashboard/account"].includes(item.href)
  );

  useEffect(() => {
    if (pendingHref === pathname) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  function navigateTo(href: string) {
    if (href === pathname) return;

    setMobileMenuOpen(false);
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="min-h-screen">
      {(isPending || pendingHref) ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-transparent">
          <div className="h-full w-1/3 animate-[loader-slide_1.1s_ease-in-out_infinite] rounded-full bg-primary shadow-glow" />
        </div>
      ) : null}
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-44 pt-4 md:px-6 md:pb-28 lg:px-8 lg:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-card backdrop-blur lg:flex lg:flex-col">
          <div className="flex items-start justify-between gap-3">
            <AppLogo href="/" />
            <ThemeToggle />
          </div>
          <div className="mt-8 flex-1 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(item.href);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
                    active && "bg-primary text-primary-foreground shadow-glow hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {pendingHref === item.href ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
          <form action={signOutAction} className="mt-4">
            <SubmitButton
              type="submit"
              variant="outline"
              loadingText="Signing out..."
              className="w-full justify-start rounded-2xl border-rose-300/70 bg-rose-50 text-rose-700 shadow-sm hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </SubmitButton>
          </form>
          <div className="rounded-3xl bg-secondary/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{appHostname}</Badge>
              <Badge variant={planName === "Plus" ? "success" : "secondary"}>{planName}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              ChatDora keeps local business replies fast, consistent, and lead-focused.
            </p>
            {planName !== "Plus" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Free plan: {monthlyMessagesRemaining ?? 0} of 100 messages left this month. Upgrade to Plus for {`₹${PLUS_PLAN_PRICE_INR}`}/month.
              </p>
            ) : null}
          </div>
        </aside>
        <div className="flex-1">
          <header className="mb-6 flex items-center justify-between gap-4 rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-card backdrop-blur lg:hidden">
            <AppLogo href="/" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/70 text-foreground shadow-sm transition-colors hover:bg-secondary"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>
          {children}
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,22rem)] flex-col border-l border-border/70 bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-background/70 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Navigation</div>
                <div className="text-xs text-muted-foreground">
                  {appHostname} · {planName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/70 text-foreground transition-colors hover:bg-secondary"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateTo(item.href);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
                      active && "bg-primary text-primary-foreground shadow-glow hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {pendingHref === item.href ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <form action={signOutAction} className="mt-4">
              <SubmitButton
                type="submit"
                variant="outline"
                loadingText="Signing out..."
                className="h-11 w-full justify-center rounded-2xl border-border bg-background/70 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </SubmitButton>
            </form>
          </aside>
        </div>
      ) : null}
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border border-border/70 bg-card/95 p-2 shadow-card backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {mobilePrimaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  navigateTo(item.href);
                }}
                className={cn(
                  "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[10px] leading-tight text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {pendingHref === item.href ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-6 lg:hidden" />
    </div>
  );
}

export function DashboardHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          ChatDora dashboard
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DashboardSignOut({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <SubmitButton variant="outline" loadingText="Signing out...">
        Sign out
      </SubmitButton>
    </form>
  );
}
