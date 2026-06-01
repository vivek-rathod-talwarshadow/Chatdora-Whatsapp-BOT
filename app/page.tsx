import { ArrowRight, BrainCircuit, Bot, Handshake, MessageCircleReply, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeroChatPreview } from "@/components/marketing/hero-chat-preview";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_MONTHLY_MESSAGE_LIMIT, PLUS_PLAN_PRICE_INR } from "@/lib/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatIndianCurrency } from "@/lib/utils";

const features = [
  { title: "AI Auto Replies", description: "Short, business-safe WhatsApp responses that stay on topic.", icon: Bot },
  { title: "Multi-Model Fallback", description: "Automatically tries OpenRouter, Groq, and Hugging Face when needed.", icon: BrainCircuit },
  { title: "Lead Collection", description: "Detects buying intent and saves leads to your CRM dashboard on Plus.", icon: Sparkles },
  { title: "Human Handoff", description: "Switches to a safe support reply whenever a customer asks for a person.", icon: Handshake },
  { title: "FAQ Training", description: "Organize answers, keywords, and priority so common questions reply instantly on Plus.", icon: MessageCircleReply },
  { title: "No Coding Needed", description: "Business-friendly dashboard for setup, testing, and WhatsApp connection.", icon: Wrench }
];

const plans = [
  {
    name: "Free",
    amount: 0,
    description: "Start with WhatsApp auto-replies and keep setup simple.",
    bullets: [
      `Up to ${FREE_MONTHLY_MESSAGE_LIMIT} messages/month`,
      "Business profile, AI settings, WhatsApp connection",
      "FAQ manager, Lead CRM, Contacts, and logs locked"
    ]
  },
  {
    name: "Plus",
    amount: PLUS_PLAN_PRICE_INR,
    description: "Unlock every current ChatDora feature for one flat monthly price.",
    bullets: [
      "All current features unlocked",
      "FAQ manager, Lead CRM, Contacts, Conversation logs",
      "Best fit for active businesses"
    ]
  }
];

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[2rem] border border-border/60 bg-white/80 p-4 shadow-card backdrop-blur dark:bg-card/80">
          <AppLogo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Login"}</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-10 px-1 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <Badge className="w-fit">AI WhatsApp Bot for Local Shops</Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-[var(--font-sora)] text-4xl font-semibold leading-tight md:text-6xl">
                Turn missed WhatsApp questions into instant replies and real leads.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                ChatDora helps local businesses answer WhatsApp messages faster, then lets them upgrade to Plus when they need FAQs, CRM, contacts, and logs.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#demo">View Demo</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <div className="text-2xl font-semibold">12s</div>
                <div className="text-sm text-muted-foreground">Fallback timeout per AI model</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-semibold">5 models</div>
                <div className="text-sm text-muted-foreground">General FAQ candidates supported</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-semibold">{FREE_MONTHLY_MESSAGE_LIMIT}</div>
                <div className="text-sm text-muted-foreground">Free plan monthly message limit</div>
              </Card>
            </div>
          </div>
          <div id="demo">
            <HeroChatPreview />
          </div>
        </section>

        <section className="space-y-6 py-10">
          <div className="max-w-2xl space-y-3">
            <Badge variant="secondary" className="w-fit">
              Built for local business support teams
            </Badge>
            <h2 className="font-[var(--font-sora)] text-3xl font-semibold md:text-4xl">Everything needed for a practical WhatsApp support MVP.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6 max-w-2xl space-y-3">
            <Badge variant="secondary" className="w-fit">
              Simple pricing
            </Badge>
            <h2 className="font-[var(--font-sora)] text-3xl font-semibold md:text-4xl">One free plan to start, one paid plan when you grow.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={index === 1 ? "border-primary/40 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-500/10 dark:to-card" : undefined}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 text-4xl font-semibold">
                    {formatIndianCurrency(plan.amount)}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                  <div className="mb-5 space-y-2 text-sm text-muted-foreground">
                    {plan.bullets.map((bullet) => (
                      <div key={bullet}>{bullet}</div>
                    ))}
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/signup">{plan.name === "Free" ? "Start Free" : "Choose Plus"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <PublicFooter />
      </div>
    </main>
  );
}
