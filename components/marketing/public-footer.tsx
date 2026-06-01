import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PublicFooter() {
  return (
    <footer className="mt-6 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-card md:mt-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="font-semibold">ChatDora</div>
          <div className="text-sm text-muted-foreground">chatdora.in | contactus@chatdora.in | 7622858519</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/signup">Start Free</Link>
        </Button>
      </div>
    </footer>
  );
}
