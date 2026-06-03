import { ArrowRight, BrainCircuit, Bot, Handshake, MessageCircleReply, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeroChatPreview } from "@/components/marketing/hero-chat-preview";
import { PublicFooter } from "@/components/marketing/public-footer";
import { HelpForm } from "@/components/marketing/help-form";
import { SeoSchema } from "@/components/marketing/seo-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { FREE_MONTHLY_MESSAGE_LIMIT, PLUS_PLAN_PRICE_INR } from "@/lib/plans";
import { getAppUrl } from "@/lib/config";
import { formatIndianCurrency } from "@/lib/utils";

const features = [
  { title: "AI Auto Replies", description: "Short, business-safe WhatsApp responses that stay on topic.", icon: Bot },
  { title: "Chatdora AI", description: "Accurate answers powered by your business knowledge.", icon: BrainCircuit },
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

const appUrl = getAppUrl();

export const metadata = {
  title: "ChatDora | WhatsApp Bot for Business, FAQ Bot, AI Auto Reply & Lead Capture",
  description:
    "ChatDora is a WhatsApp bot for business that automates replies, trains on FAQs, captures leads, manages contacts, and helps local shops respond faster with AI.",
  alternates: {
    canonical: appUrl
  }
};

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <SeoSchema />
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
            <div className="space-y-4">
              <h1 className="max-w-2xl font-[var(--font-sora)] text-4xl font-semibold leading-tight md:text-6xl">
                ChatDora turns WhatsApp questions into instant replies, qualified leads, and faster customer support.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                ChatDora is a WhatsApp bot for business that helps local shops automate WhatsApp replies, train an FAQ bot, capture leads, manage contacts, and scale customer conversations with AI.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/help">Help</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <div className="text-2xl font-semibold">Chatdora AI</div>
                <div className="text-sm text-muted-foreground">Trained to answer FAQs and assist visitors instantly</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-semibold">24/7 Support</div>
                <div className="text-sm text-muted-foreground">Handle customer questions anytime without delays</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-semibold">Instant Answers</div>
                <div className="text-sm text-muted-foreground">Respond to customer questions in seconds, 24/7</div>
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
          <div className="mb-6 max-w-3xl space-y-3">
            <Badge variant="secondary" className="w-fit">
              Search-ready product overview
            </Badge>
            <h2 className="font-[var(--font-sora)] text-3xl font-semibold md:text-4xl">
              A WhatsApp bot platform built for ChatDora brand searches, business automation searches, and local support workflows.
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              If someone searches for ChatDora, WhatsApp bot, AI WhatsApp bot, WhatsApp FAQ bot, WhatsApp auto reply software, or WhatsApp lead capture for small business, this page now explains those use cases clearly for both people and search engines.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>What ChatDora helps businesses do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
                <p>
                  ChatDora helps businesses run a WhatsApp chatbot that replies instantly, answers common product and service questions, hands conversations to humans when needed, and keeps response quality consistent.
                </p>
                <p>
                  The platform is designed for shop owners, service businesses, support teams, and small businesses that want WhatsApp automation without building custom code or managing complex bot logic.
                </p>
                <p>
                  Teams can use ChatDora to reduce missed messages, improve WhatsApp response time, collect leads from incoming chats, and keep business information ready for AI-assisted answers.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Why ChatDora fits WhatsApp bot searches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
                <p>
                  ChatDora combines WhatsApp bot automation, FAQ training, AI replies, contact organization, and lead tracking inside one dashboard, which makes it relevant for searches around business messaging software and customer support automation.
                </p>
                <p>
                  Businesses looking for a WhatsApp FAQ bot, AI auto reply tool, WhatsApp CRM starter, or simple WhatsApp support bot can start with the free plan and upgrade when they need more workflow depth.
                </p>
                <p>
                  The product is especially useful when customers ask the same questions repeatedly about pricing, availability, opening hours, bookings, delivery, services, or product details.
                </p>
              </CardContent>
            </Card>
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

        <section className="py-10">
          <div className="mb-6 max-w-2xl space-y-3">
            <Badge variant="secondary" className="w-fit">
              Website Help
            </Badge>
            <h2 className="font-[var(--font-sora)] text-3xl font-semibold md:text-4xl">Found an issue on the website or need setup help?</h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Send a short message and the ChatDora team will reply by email. This is the fastest way to report QR issues, signup problems, or anything broken on the site.
            </p>
          </div>
          <HelpForm compact />
        </section>

        <PublicFooter />
      </div>
    </main>
  );
}
