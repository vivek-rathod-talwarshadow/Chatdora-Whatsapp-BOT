"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function WhatsAppTestButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const response = await fetch("/api/whatsapp/test", { method: "POST" });
            const data = await response.json();

            if (!response.ok) {
              toast.error(data.error || "Connection test failed");
              setStatus(data.error || "Connection test failed");
              return;
            }

            toast.success("WhatsApp connection looks valid.");
            setStatus(`Connected to phone number ID ${data.phoneNumberId}`);
          });
        }}
      >
        {isPending ? "Testing..." : "Test connection"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
