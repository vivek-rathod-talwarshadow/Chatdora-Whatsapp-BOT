"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Business } from "@/lib/types";

export function BusinessProfileForm({
  business,
  showSaved,
  action,
  businessError
}: {
  business: Business | null;
  showSaved: boolean;
  action: (formData: FormData) => void | Promise<void>;
  businessError: string | null;
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
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {showSaved ? <Badge variant="success">Saved successfully</Badge> : <div />}
          <Button type="button" variant="outline" onClick={() => void generateSuggestions()} disabled={isSuggesting || !!businessError}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isSuggesting ? "Generating..." : "AI suggest profile copy"}
          </Button>
        </div>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" name="id" value={business?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              name="business_name"
              value={form.business_name}
              onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Salon, clinic, electronics shop"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">Owner name</Label>
            <Input id="owner_name" name="owner_name" value={form.owner_name} onChange={(event) => setForm((current) => ({ ...current, owner_name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" value={form.instagram} onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening_hours">Opening hours</Label>
            <Input
              id="opening_hours"
              name="opening_hours"
              value={form.opening_hours}
              onChange={(event) => setForm((current) => ({ ...current, opening_hours: event.target.value }))}
              placeholder="Mon-Sat 10am-8pm"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="min-h-[100px]" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="services">Services</Label>
            <Textarea id="services" name="services" value={form.services} onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))} className="min-h-[120px]" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="short_description">Short description</Label>
            <Textarea
              id="short_description"
              name="short_description"
              value={form.short_description}
              onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))}
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="default_fallback_message">Default fallback message</Label>
            <Textarea
              id="default_fallback_message"
              name="default_fallback_message"
              value={form.default_fallback_message}
              onChange={(event) => setForm((current) => ({ ...current, default_fallback_message: event.target.value }))}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ai_fallback_message">AI fallback message</Label>
            <Textarea
              id="ai_fallback_message"
              name="ai_fallback_message"
              value={form.ai_fallback_message}
              onChange={(event) => setForm((current) => ({ ...current, ai_fallback_message: event.target.value }))}
              className="min-h-[100px]"
            />
          </div>
          <div className="md:col-span-2">
            <SubmitButton loadingText="Saving profile...">Save business profile</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
