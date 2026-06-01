"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface CheckboxFieldProps {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CheckboxField({
  name,
  label,
  description,
  defaultChecked = false,
  disabled = false,
  className
}: CheckboxFieldProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 px-4 py-3",
        disabled && "opacity-60",
        className
      )}
    >
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <div className="min-w-0 space-y-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => setChecked((value) => !value)}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-transparent hover:border-primary/50 hover:bg-secondary",
          disabled && "cursor-not-allowed"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
