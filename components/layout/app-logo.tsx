import Image from "next/image";
import Link from "next/link";

export function AppLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-card">
        <Image src="/dora-logo.png" alt="ChatDora" fill className="object-cover" />
      </div>
      <div>
        <div className="font-semibold tracking-tight">ChatDora</div>
        <div className="text-xs text-muted-foreground">AI WhatsApp Bot</div>
      </div>
    </Link>
  );
}
