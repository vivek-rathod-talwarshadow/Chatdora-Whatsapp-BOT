"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface CustomSelectOption {
  value: string;
  label: string;
}

export function CustomSelect({
  name,
  options,
  defaultValue,
  className
}: {
  name: string;
  options: CustomSelectOption[];
  defaultValue?: string;
  className?: string;
}) {
  const initialValue = options.some((option) => option.value === defaultValue) ? defaultValue! : options[0]?.value ?? "";
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedMenuHeight = Math.min(options.length * 44 + 16, 272);
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUpward = spaceBelow < estimatedMenuHeight && rect.top > spaceBelow;

      setOpenUpward(shouldOpenUpward);
      setMenuStyle({
        top: shouldOpenUpward ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 text-sm text-foreground shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate pr-3">{selected?.label ?? "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed z-[120] overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              style={{
                top: openUpward ? undefined : menuStyle.top,
                bottom: openUpward ? window.innerHeight - menuStyle.top : undefined,
                left: menuStyle.left,
                width: menuStyle.width
              }}
            >
              <div className="max-h-64 overflow-auto p-2">
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setValue(option.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <span className="truncate pr-3">{option.label}</span>
                      <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
