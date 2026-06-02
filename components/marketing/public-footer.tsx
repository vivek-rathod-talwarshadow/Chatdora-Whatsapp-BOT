import Link from "next/link";

import { CHATDORA_CONTACT_EMAIL, CHATDORA_DOMAIN, CHATDORA_SUPPORT_PHONE_RAW, getChatDoraMailtoLink } from "@/lib/contact";
import { Button } from "@/components/ui/button";

export function PublicFooter() {
  return (
    <footer className="mt-6 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-card md:mt-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="font-semibold">ChatDora</div>
          <div className="text-sm text-muted-foreground">
            {CHATDORA_DOMAIN} | {CHATDORA_CONTACT_EMAIL} | {CHATDORA_SUPPORT_PHONE_RAW}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/contact-us" className="hover:text-foreground">
              Contact Us
            </Link>
            <Link href="/help" className="hover:text-foreground">
              Help
            </Link>
            <a href={`tel:${CHATDORA_SUPPORT_PHONE_RAW}`} className="hover:text-foreground">
              Call Us
            </a>
            <a href={getChatDoraMailtoLink("ChatDora Support Request")} className="hover:text-foreground">
              Email Us
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/help">Help</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Start Free</Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
