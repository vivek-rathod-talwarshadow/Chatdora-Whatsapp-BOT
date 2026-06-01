"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const conversation = [
  {
    sender: "user" as const,
    text: "Hi, do you offer website setup for my store?"
  },
  {
    sender: "bot" as const,
    text: "Yes, we help local shops with website setup and WhatsApp automation. Please share your name and requirement so our team can guide you."
  },
  {
    sender: "user" as const,
    text: "Can I talk to a person?"
  },
  {
    sender: "bot" as const,
    text: "Sure, our team will contact you shortly. Please share your name and requirement."
  }
];

export function HeroChatPreview() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      const nextMessage = conversation[visibleCount];

      if (!nextMessage) {
        timer = setTimeout(() => {
          setIsTyping(false);
          setVisibleCount(1);
        }, 1800);
        return;
      }

      if (nextMessage.sender === "bot") {
        setIsTyping(true);
        timer = setTimeout(() => {
          setVisibleCount((current) => current + 1);
          setIsTyping(false);
        }, 1200);
        return;
      }

      timer = setTimeout(() => {
        setVisibleCount((current) => current + 1);
      }, 950);
    };

    scheduleNext();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visibleCount]);

  return (
    <Card className="relative overflow-hidden border-white/50 bg-white/85 p-0 shadow-[0_24px_80px_rgba(6,78,59,0.16)] dark:border-white/10 dark:bg-card/90">
      <div className="border-b border-border/70 bg-emerald-950 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">ChatDora Demo Bot</div>
            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(110,231,183,0.15)] animate-chat-presence" />
              Online now
            </div>
          </div>
          <Badge variant="success">AI + FAQ</Badge>
        </div>
      </div>
      <div className="relative space-y-4 bg-[linear-gradient(180deg,#f6fff8,#fff8f0)] p-5 dark:bg-[linear-gradient(180deg,#0e1f1a,#1d1712)]">
        <div className="pointer-events-none absolute inset-x-5 top-0 h-12 bg-gradient-to-b from-white/35 to-transparent dark:from-white/5" />
        {conversation.slice(0, visibleCount).map((message, index) => (
          <div
            key={`${message.sender}-${index}`}
            className={[
              "animate-chat-bubble opacity-0 text-sm [animation-fill-mode:forwards]",
              message.sender === "user"
                ? "ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-emerald-600 px-4 py-3 text-white"
                : "max-w-[85%] rounded-3xl rounded-bl-md bg-white px-4 py-3 text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100"
            ].join(" ")}
            style={{ animationDelay: `${index * 120}ms` }}
          >
            {message.text}
          </div>
        ))}

        {isTyping ? (
          <div className="animate-chat-bubble inline-flex items-center gap-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 text-slate-500 shadow-sm [animation-fill-mode:forwards] dark:bg-slate-900 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-current animate-chat-dot [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-current animate-chat-dot [animation-delay:180ms]" />
            <span className="h-2 w-2 rounded-full bg-current animate-chat-dot [animation-delay:360ms]" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
