"use client";

import { ArrowRight, CheckCircle2, Circle, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { InputGuideHint } from "@/components/dashboard/input-guide-hint";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessProfileCompletion, getSetupJourneyStatus } from "@/lib/business-onboarding";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";

function FieldHeading({
  htmlFor,
  label,
  description,
  example,
  pulse = false
}: {
  htmlFor: string;
  label: string;
  description: string;
  example?: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <InputGuideHint title={label} description={description} example={example} pulse={pulse} />
    </div>
  );
}

function SetupStepCard({
  title,
  description,
  href,
  done,
  active
}: {
  title: string;
  description: string;
  href: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border p-4 transition-all",
        done
          ? "border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/25 dark:bg-emerald-500/10"
          : active
            ? "border-primary/30 bg-primary/5 shadow-glow"
            : "border-border/70 bg-background/70"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          ) : (
            <Circle className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          <Button asChild variant={active ? "default" : "outline"} className="mt-4 h-10 rounded-2xl px-4 text-sm">
            <Link href={href}>
              {done ? "Review" : active ? "Do this now" : "Open"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BusinessProfileForm({
  business,
  showSaved,
  action,
  businessError,
  showWelcome
}: {
  business: Business | null;
  showSaved: boolean;
  action: (formData: FormData) => void | Promise<void>;
  businessError: string | null;
  showWelcome: boolean;
}) {
  const [form, setForm] = useState({
    business_name: business?.business_name ?? "",
    category: business?.category ?? "",
    owner_name: business?.owner_name ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
    website: business?.website ?? "",
    instagram: business?.instagram ?? "",
    opening_hours: business?.opening_hours ?? "",
    address: business?.address ?? "",
    services: business?.services ?? "",
    short_description: business?.short_description ?? "",
    default_fallback_message:
      business?.default_fallback_message ?? "Thanks for your message. Our team will reply shortly. Please share your name and requirement.",
    ai_fallback_message: business?.ai_fallback_message ?? ""
  });
  const [isSuggesting, setIsSuggesting] = useState(false);

  const completion = getBusinessProfileCompletion(form);
  const setupJourney = getSetupJourneyStatus(form);
  const profileStatus = completion.percent >= 85 ? "Almost complete" : completion.percent >= 45 ? "Good progress" : "Just getting started";

  async function generateSuggestions() {
    if (!form.business_name.trim()) {
      toast.error("Add a business name first.");
      return;
    }

    try {
      setIsSuggesting(true);
      const response = await fetch("/api/business/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          businessName: form.business_name,
          category: form.category,
          services: form.services,
          openingHours: form.opening_hours,
          website: form.website,
          instagram: form.instagram
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate suggestions");
      }

      setForm((current) => ({
        ...current,
        category: data.suggestion.category || current.category,
        services: data.suggestion.services || current.services,
        short_description: data.suggestion.short_description || current.short_description,
        default_fallback_message: data.suggestion.default_fallback_message || current.default_fallback_message,
        ai_fallback_message: data.suggestion.ai_fallback_message || current.ai_fallback_message
      }));
      toast.success("Suggested content added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate suggestions");
    } finally {
      setIsSuggesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-white via-emerald-50/80 to-amber-50/80 dark:from-card dark:via-emerald-500/10 dark:to-amber-500/10">
        <CardContent className="pt-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{showWelcome || !business ? "Start here" : "Business setup"}</Badge>
                <Badge variant={completion.isReadyForOverview ? "success" : "secondary"}>{profileStatus}</Badge>
                {showSaved ? <Badge variant="success">Saved successfully</Badge> : null}
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Build your profile once, and every reply becomes smarter.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  Start by filling your business details. ChatDora uses this page as the foundation for FAQs, AI replies, WhatsApp responses, and lead capture.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-primary/15 bg-card/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Profile completion</div>
                    <div className="text-sm text-muted-foreground">
                      {completion.completedCount} of {completion.totalFields} details added
                    </div>
                  </div>
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
                    {completion.percent}%
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {completion.completedFields.slice(0, 6).map((field) => (
                    <Badge key={field.key} variant="success" className="animate-guide-pop">
                      {field.label}
                    </Badge>
                  ))}
                  {completion.missingFields.slice(0, 4).map((field) => (
                    <Badge key={field.key} variant="outline">
                      Add {field.label.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {setupJourney.map((step) => (
                  <SetupStepCard
                    key={step.href}
                    title={step.label}
                    description={step.description}
                    href={step.href}
                    done={step.done}
                    active={step.active}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wand2 className="h-4 w-4 text-primary" />
                How this page helps you
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="animate-guide-float rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="font-medium text-foreground">1. Add business basics</div>
                  <p className="mt-1 leading-6">Name, category, contact details, hours, and address help the bot answer common customer questions clearly.</p>
                </div>
                <div className="animate-guide-float rounded-2xl border border-border/70 bg-background/70 p-4 [animation-delay:140ms]">
                  <div className="font-medium text-foreground">2. Describe your services</div>
                  <p className="mt-1 leading-6">A strong services list and short description make AI replies sound much more natural and relevant.</p>
                </div>
                <div className="animate-guide-float rounded-2xl border border-border/70 bg-background/70 p-4 [animation-delay:280ms]">
                  <div className="font-medium text-foreground">3. Save and continue setup</div>
                  <p className="mt-1 leading-6">After this, move to FAQs, connect WhatsApp, and test the bot before sending customers live replies.</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void generateSuggestions()}
                disabled={isSuggesting || !!businessError}
                className="mt-5 w-full rounded-2xl"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isSuggesting ? "Generating..." : "AI suggest profile copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form action={action} className="space-y-6">
            <input type="hidden" name="id" value={business?.id ?? ""} />

            <section className="rounded-[1.75rem] border border-border/70 bg-secondary/30 p-5">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Business identity</h3>
                <p className="mt-1 text-sm text-muted-foreground">These details tell visitors and the bot who you are.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="business_name"
                    label="Business name"
                    description="Use the public name customers already know. This is the first identity detail your bot should trust."
                    example="Glow Dental Care"
                    pulse={!form.business_name}
                  />
                  <Input
                    id="business_name"
                    name="business_name"
                    value={form.business_name}
                    onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
                    placeholder="Your shop, clinic, salon, or brand name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="category"
                    label="Category"
                    description="Choose the main type of business you run so ChatDora can frame replies in the right context."
                    example="Salon, clinic, electronics shop"
                    pulse={!form.category}
                  />
                  <Input
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Salon, clinic, electronics shop"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="owner_name"
                    label="Owner name"
                    description="Add the founder or owner if customers sometimes ask who they should speak with."
                    example="Dr. Priya Sharma"
                    pulse={!form.owner_name}
                  />
                  <Input
                    id="owner_name"
                    name="owner_name"
                    value={form.owner_name}
                    onChange={(event) => setForm((current) => ({ ...current, owner_name: event.target.value }))}
                    placeholder="Owner or manager name"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="short_description"
                    label="Short description"
                    description="Summarize what makes your business useful or special in 1 to 3 short sentences."
                    example="Family dental clinic offering cleanings, braces, and same-day appointments."
                    pulse={!form.short_description}
                  />
                  <Textarea
                    id="short_description"
                    name="short_description"
                    value={form.short_description}
                    onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))}
                    className="min-h-[120px]"
                    placeholder="What do you do, who do you serve, and what do customers usually come to you for?"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-border/70 p-5">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Contact and availability</h3>
                <p className="mt-1 text-sm text-muted-foreground">Help customers know how and when to reach you.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="phone"
                    label="Phone"
                    description="Use the main number customers should call or message for bookings, orders, or support."
                    example="+91 98765 43210"
                    pulse={!form.phone}
                  />
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="email"
                    label="Email"
                    description="Add your customer-facing email if people ask for quotes, documents, or support."
                    example="hello@yourbusiness.com"
                    pulse={!form.email}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="hello@yourbusiness.com"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="website"
                    label="Website"
                    description="Share your main website so the bot can reference your online presence when needed."
                    example="https://yourbusiness.com"
                    pulse={!form.website}
                  />
                  <Input
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                    placeholder="https://yourbusiness.com"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="instagram"
                    label="Instagram"
                    description="Add your Instagram handle or URL if customers often discover you there."
                    example="@glowdentalcare"
                    pulse={!form.instagram}
                  />
                  <Input
                    id="instagram"
                    name="instagram"
                    value={form.instagram}
                    onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))}
                    placeholder="@yourbrand or Instagram URL"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="opening_hours"
                    label="Opening hours"
                    description="Write the exact days and times customers can visit, call, or expect a response."
                    example="Mon-Sat 10am-8pm"
                    pulse={!form.opening_hours}
                  />
                  <Input
                    id="opening_hours"
                    name="opening_hours"
                    value={form.opening_hours}
                    onChange={(event) => setForm((current) => ({ ...current, opening_hours: event.target.value }))}
                    placeholder="Mon-Sat 10am-8pm"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <FieldHeading
                    htmlFor="address"
                    label="Address"
                    description="Add the full store or office address so the bot can answer location questions accurately."
                    example="12 MG Road, Indiranagar, Bengaluru"
                    pulse={!form.address}
                  />
                  <Textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    className="min-h-[100px]"
                    placeholder="Full address with locality, city, and landmark if useful"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-border/70 p-5">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">What you offer</h3>
                <p className="mt-1 text-sm text-muted-foreground">This is the core knowledge your bot uses to reply well.</p>
              </div>
              <div className="grid gap-5">
                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="services"
                    label="Services"
                    description="List your products, services, packages, or specialties in plain language customers would actually ask about."
                    example="Teeth cleaning, braces consultation, root canal, kids dental check-up"
                    pulse={!form.services}
                  />
                  <Textarea
                    id="services"
                    name="services"
                    value={form.services}
                    onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))}
                    className="min-h-[120px]"
                    placeholder="List key services, categories, or top-selling items"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-border/70 p-5">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">Fallback replies</h3>
                <p className="mt-1 text-sm text-muted-foreground">These messages appear when an exact FAQ answer is not available.</p>
              </div>
              <div className="grid gap-5">
                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="default_fallback_message"
                    label="Default fallback message"
                    description="Write a polite backup reply that keeps the conversation moving and asks for the next useful detail."
                    example="Thanks for reaching out. Please share your name and what you need, and our team will help you shortly."
                    pulse={!form.default_fallback_message}
                  />
                  <Textarea
                    id="default_fallback_message"
                    name="default_fallback_message"
                    value={form.default_fallback_message}
                    onChange={(event) => setForm((current) => ({ ...current, default_fallback_message: event.target.value }))}
                    className="min-h-[100px]"
                    placeholder="Your standard fallback response"
                  />
                </div>

                <div className="space-y-2">
                  <FieldHeading
                    htmlFor="ai_fallback_message"
                    label="AI fallback message"
                    description="Use this if you want a more custom AI response when the bot cannot answer confidently."
                    example="We can help with that. Tell us the product or service you need and we will guide you."
                    pulse={!form.ai_fallback_message}
                  />
                  <Textarea
                    id="ai_fallback_message"
                    name="ai_fallback_message"
                    value={form.ai_fallback_message}
                    onChange={(event) => setForm((current) => ({ ...current, ai_fallback_message: event.target.value }))}
                    className="min-h-[100px]"
                    placeholder="Optional AI-specific fallback reply"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-primary/15 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-semibold text-foreground">Save this profile to unlock the next setup steps</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  After saving, head to <Link href="/dashboard/faqs" className="font-medium text-primary underline-offset-4 hover:underline">FAQs</Link>, then connect
                  WhatsApp and test your bot.
                </p>
              </div>
              <SubmitButton loadingText="Saving profile..." className="min-w-[220px]">
                Save business profile
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
