"use client";

import { BellRing, Download, ShieldCheck, Smartphone, Sparkles, Waves } from "lucide-react";

import { useNativeApp } from "@/components/pwa/native-app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NativeAppCard() {
  const {
    canInstall,
    isInstalled,
    supportsNotifications,
    notificationPermission,
    supportsVibration,
    supportsBadging,
    supportsShare,
    requestInstall,
    requestNotifications,
    sendTestNotification,
    triggerHaptic,
    shareApp
  } = useNativeApp();

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-emerald-50 via-white to-orange-50 dark:from-emerald-500/10 dark:via-card dark:to-orange-500/10">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Native app mode</CardTitle>
            <CardDescription>
              Install ChatDora as a device app and turn on app-style capabilities like notifications, vibration, and share sheet support.
            </CardDescription>
          </div>
          <Badge variant={isInstalled ? "success" : "secondary"}>{isInstalled ? "Installed" : "Web + PWA"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusPill
            icon={Download}
            label="Install prompt"
            value={canInstall ? "Ready" : isInstalled ? "Installed" : "Waiting"}
          />
          <StatusPill
            icon={BellRing}
            label="Notifications"
            value={!supportsNotifications ? "Unsupported" : notificationPermission}
          />
          <StatusPill
            icon={Waves}
            label="Vibration / haptics"
            value={supportsVibration ? "Supported" : "Limited"}
          />
          <StatusPill
            icon={Smartphone}
            label="Badges / share"
            value={supportsBadging || supportsShare ? "Supported" : "Limited"}
          />
        </div>

        <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
          Installed app assets now use your uploaded logo, while the website keeps the existing ChatDora logo. Device-level features depend on browser and OS support, but this setup enables the strongest native-like PWA behavior available on modern browsers.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void requestInstall()} disabled={!canInstall && !isInstalled}>
            <Download className="mr-2 h-4 w-4" />
            {isInstalled ? "Installed" : "Install app"}
          </Button>
          <Button variant="outline" onClick={() => void requestNotifications()}>
            <BellRing className="mr-2 h-4 w-4" />
            Enable notifications
          </Button>
          <Button variant="outline" onClick={() => void sendTestNotification()} disabled={notificationPermission !== "granted"}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Test notification
          </Button>
          <Button variant="outline" onClick={() => triggerHaptic([25, 30, 25])} disabled={!supportsVibration}>
            <Waves className="mr-2 h-4 w-4" />
            Test haptic
          </Button>
          <Button variant="outline" onClick={() => void shareApp()} disabled={!supportsShare}>
            <Sparkles className="mr-2 h-4 w-4" />
            Share app
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Download;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="mt-2 text-sm capitalize text-muted-foreground">{value}</div>
    </div>
  );
}
