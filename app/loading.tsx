import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-5 py-3 shadow-card backdrop-blur">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">Loading ChatDora...</span>
      </div>
    </div>
  );
}
