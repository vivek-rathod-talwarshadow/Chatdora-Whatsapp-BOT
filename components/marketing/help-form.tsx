"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HelpFormProps = {
  compact?: boolean;
};

const initialForm = {
  email: "",
  message: "",
  name: "",
  pageUrl: ""
};

export function HelpForm({ compact = false }: HelpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialForm);

  async function submitHelpRequest() {
    const response = await fetch("/api/help", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      toast.error(payload.error || "Unable to send your help request.");
      return;
    }

    toast.success(payload.message || "Your message has been sent.");
    setForm(initialForm);
  }

  const cardDescription = compact
    ? "Send a quick issue report and our team will reply by email."
    : "Use this short form to report any issue you found on the website or ask for setup help.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compact ? "Need Help?" : "Send a Help Request"}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={() => {
            startTransition(() => {
              void submitHelpRequest();
            });
          }}
          className="space-y-4"
        >
          <div className={compact ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
            <div className="space-y-2">
              <Label htmlFor="help-name">Name</Label>
              <Input
                id="help-name"
                placeholder="Your name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-email">Email</Label>
              <Input
                id="help-email"
                type="email"
                placeholder="contactus@chatdora.in"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="help-page-url">Page URL or screen name</Label>
            <Input
              id="help-page-url"
              placeholder="Optional: /dashboard, /signup, pricing section"
              value={form.pageUrl}
              onChange={(event) => setForm((current) => ({ ...current, pageUrl: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="help-message">Issue or question</Label>
            <Textarea
              id="help-message"
              placeholder="Tell us what happened, what you expected, and how we can reach you."
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              required
            />
          </div>

          <Button type="submit" className={compact ? "w-full md:w-auto" : "w-full"} disabled={isPending}>
            {isPending ? "Sending..." : "Send Help Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
