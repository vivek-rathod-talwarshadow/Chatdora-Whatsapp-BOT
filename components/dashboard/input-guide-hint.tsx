"use client";

import { Info, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InputGuideHint({
  title,
  description,
  example,
  pulse = false
}: {
  title: string;
  description: string;
  example?: string;
  pulse?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`How to fill ${title}`}
        className={cn(
          "group inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary",
          pulse && "animate-guide-pulse border-primary/40 text-primary"
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="animate-guide-pop absolute right-0 top-full z-30 mt-2 w-72 rounded-3xl border border-primary/15 bg-card/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {title}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              {example ? (
                <div className="mt-3 rounded-2xl bg-secondary/70 px-3 py-2 text-xs text-secondary-foreground">
                  Example: {example}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => setOpen(false)}
              aria-label={`Close help for ${title}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
