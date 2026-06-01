"use client";

import { startTransition, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function TestBotSimulator({ businessId }: { businessId: string }) {
  const [message, setMessage] = useState("Do you offer website setup?");
  const [result, setResult] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Internal simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a customer message..." />
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              setIsPending(true);
              startTransition(async () => {
                const response = await fetch("/api/test-bot", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ businessId, message })
                });
                const data = await response.json();
                setIsPending(false);

                if (!response.ok) {
                  toast.error(data.error || "Simulation failed");
                  return;
                }

                setResult(data);
              });
            }}
          >
            {isPending ? "Testing..." : "Run test"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge>Source: {result.replySource}</Badge>
                <Badge variant="secondary">Lead detected: {String(result.leadDetected)}</Badge>
                <Badge variant="outline">Engine: {result.replySource === "ai" ? "ChatDora AI" : "Rule-based"}</Badge>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-4 text-sm">{result.finalReply}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border p-4 text-sm">
                  <div className="font-medium">Matched FAQ</div>
                  <div className="text-muted-foreground">{result.matchedFaqId ?? "No FAQ match"}</div>
                </div>
                <div className="rounded-2xl border border-border p-4 text-sm">
                  <div className="font-medium">Reply engine</div>
                  <div className="text-muted-foreground">
                    {result.replySource === "ai" ? "ChatDora AI" : "Internal FAQ / fallback logic"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Run a test message to preview matched FAQ, reply engine, and final reply.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
