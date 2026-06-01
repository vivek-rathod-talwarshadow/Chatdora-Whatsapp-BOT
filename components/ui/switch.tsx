import type * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Switch({ className, label, ...props }: SwitchProps) {
  return (
    <label className={cn("flex items-center justify-between gap-4", className)}>
      {label ? <span className="text-sm text-foreground">{label}</span> : null}
      <span className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="h-7 w-12 rounded-full bg-secondary transition-colors peer-checked:bg-primary" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
