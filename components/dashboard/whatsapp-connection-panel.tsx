"use client";

import { AlertTriangle, CheckCircle2, Loader2, QrCode, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { InboundCallbackHealth, WhatsAppConnection } from "@/lib/types";

const statusTone: Record<string, "outline" | "success" | "danger" | "secondary"> = {
  not_connected: "outline",
  qr_ready: "secondary",
  connecting: "secondary",
  connected: "success",
  disconnected: "outline",
  failed: "danger"
};

export function WhatsAppConnectionPanel({
  businessId,
  initialConnection,
  initialActiveMode,
  initialBotActive,
  initialEngineHealth,
  inboundCallbackHealth,
  workspaceId
}: {
  businessId: string;
  initialConnection: WhatsAppConnection | null;
  initialActiveMode: "qr_login" | "meta_api" | null;
  initialBotActive: boolean;
  initialEngineHealth: { online: boolean; data: any } | null;
  inboundCallbackHealth: InboundCallbackHealth;
  workspaceId: string;
}) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(initialConnection);
  const [activeMode, setActiveMode] = useState<"qr_login" | "meta_api" | null>(initialActiveMode);
  const [botActive, setBotActive] = useState(initialBotActive);
  const [engineHealth, setEngineHealth] = useState(initialEngineHealth);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const statusRequestInFlightRef = useRef(false);
  const syncRequestInFlightRef = useRef(false);
  const currentStatus = connection?.status ?? "not_connected";
  const connectedPhoneLabel =
    connection?.connected_phone || currentStatus === "connected"
      ? connection?.connected_phone || "Connected via QR session (number not exposed by engine)"
      : "Will appear after successful scan";

  const refreshStatus = useCallback(async () => {
    if (statusRequestInFlightRef.current) {
      return;
    }

    try {
      statusRequestInFlightRef.current = true;
      const response = await fetch(`/api/whatsapp/qr/status?businessId=${businessId}`, {
        cache: "no-store"
      });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setConnection(data.connection ?? null);
      if (data.activeMode) {
        setActiveMode(data.activeMode);
      }
      setEngineHealth(data.engineHealth ?? null);
      setQrCode(data.qr ?? null);

      if (data.connection?.status === "connected") {
        setIsQrOpen(false);
      }
    } catch {
      return;
    } finally {
      statusRequestInFlightRef.current = false;
    }
  }, [businessId]);

  useEffect(() => {
    void refreshStatus();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      void refreshStatus();
    }, currentStatus === "connected" ? 15000 : 3000);

    return () => clearInterval(interval);
  }, [currentStatus, refreshStatus]);

  useEffect(() => {
    if (activeMode !== "qr_login" || inboundCallbackHealth.isPublic || currentStatus !== "connected" || !botActive) {
      return;
    }

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (syncRequestInFlightRef.current) {
        return;
      }

      syncRequestInFlightRef.current = true;
      void fetch("/api/whatsapp/qr/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId })
      })
        .catch(() => undefined)
        .finally(() => {
          syncRequestInFlightRef.current = false;
        });
    }, 20000);

    return () => clearInterval(interval);
  }, [activeMode, botActive, businessId, currentStatus, inboundCallbackHealth.isPublic]);

  async function switchMode(mode: "qr_login" | "meta_api") {
    try {
      setPendingAction(mode);
      const response = await fetch("/api/whatsapp/connection/mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId, mode })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to switch connection mode");
      }

      toast.success(mode === "qr_login" ? "QR login mode activated." : "Official API mode activated.");
      setActiveMode(mode);
      await refreshStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to switch connection mode");
    } finally {
      setPendingAction(null);
    }
  }

  async function startQr() {
    try {
      setPendingAction("start");
      await switchMode("qr_login");

      const response = await fetch("/api/whatsapp/qr/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to start QR session");
      }

      setQrCode(data.qr ?? null);
      setIsQrOpen(true);

      if (!data.qr) {
        toast.warning("QR is still initializing. Try again in a few seconds.");
      } else {
        toast.success("QR generated. Scan it with WhatsApp.");
      }

      await refreshStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start QR session");
    } finally {
      setPendingAction(null);
    }
  }

  async function restartSession() {
    try {
      setPendingAction("restart");
      const response = await fetch("/api/whatsapp/qr/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId, forceRestart: true })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to restart session");
      }

      setQrCode(data.qr ?? null);
      setIsQrOpen(Boolean(data.qr));

      if (data.needsReconnect) {
        toast.error("This WhatsApp session is still active inside the engine. Log it out there first, then start QR again.");
      } else {
        toast.success("Session restarted. Scan the QR if needed.");
      }

      await refreshStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to restart session");
    } finally {
      setPendingAction(null);
    }
  }

  async function updateBotActive(nextValue: boolean) {
    try {
      setPendingAction("activate");
      const response = await fetch("/api/whatsapp/connection/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessId, isActive: nextValue })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update bot state");
      }

      setBotActive(nextValue);
      toast.success(nextValue ? "Bot active enabled." : "Bot active disabled.");
      await refreshStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update bot state");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Instant QR Login</CardTitle>
                <CardDescription>Connect WhatsApp by scanning QR. No Meta setup required.</CardDescription>
              </div>
              <Badge>Recommended for easy setup</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusTone[currentStatus]}>{currentStatus.replace("_", " ")}</Badge>
              {connection?.connected_phone ? <Badge variant="outline">{connection.connected_phone}</Badge> : null}
              <Badge variant="outline">Workspace: {workspaceId}</Badge>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              QR Login is simple and free to start. It may occasionally require re-scan if WhatsApp logs out.
            </div>

            {engineHealth?.online === false ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                WhatsApp Engine is offline. Please check wa.chatdora.in deployment.
              </div>
            ) : null}

            {activeMode === "qr_login" && !inboundCallbackHealth.isPublic ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Local QR test mode is active. Since the deployed engine cannot call back into{" "}
                <span className="font-medium">{inboundCallbackHealth.appUrl}</span>, this dashboard will poll the engine
                for new messages and send replies from here while this page stays open.
              </div>
            ) : null}

            {currentStatus === "disconnected" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                WhatsApp disconnected. Please reconnect by scanning QR again.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void startQr()} disabled={pendingAction !== null}>
                {pendingAction === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                Connect with QR
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsQrOpen(true)} disabled={!qrCode}>
                View QR
              </Button>
              <Button type="button" variant="outline" onClick={() => void restartSession()} disabled={pendingAction !== null}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect / Restart Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Official WhatsApp Business API</CardTitle>
                <CardDescription>Stable official API setup for advanced business use.</CardDescription>
              </div>
              <Badge variant="secondary">Advanced</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              Keep QR mode for fast onboarding. Switch to Official API when you need the Meta Cloud API path.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => void switchMode("meta_api")} disabled={pendingAction !== null}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Configure Official API
              </Button>
              <Button asChild variant="ghost">
                <a href="/dashboard/admin/whatsapp">Request Setup</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current active connection</CardTitle>
            <CardDescription>Only one connection mode can be active per business at a time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4 text-primary" />
                Active mode
              </div>
              <div className="text-sm text-muted-foreground">{activeMode ? activeMode.replace("_", " ") : "Not activated yet"}</div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                {engineHealth?.online ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-primary" />}
                Engine health
              </div>
              <div className="text-sm leading-6 text-muted-foreground" suppressHydrationWarning>
                {engineHealth?.online ? "Online" : "Offline"}
                {engineHealth?.data?.activeSessions !== undefined ? ` | Active sessions: ${engineHealth.data.activeSessions}` : ""}
                {engineHealth?.data?.uptime ? ` | Uptime: ${engineHealth.data.uptime}` : ""}
              </div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 text-sm font-medium">Connected phone</div>
              <div className="text-sm text-muted-foreground">{connectedPhoneLabel}</div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 text-sm font-medium">Inbound callback</div>
              <div className="text-sm text-muted-foreground">
                {inboundCallbackHealth.isPublic ? "Reachable by deployed engine" : "Not publicly reachable"}
              </div>
              <div className="mt-2 break-all text-xs leading-5 text-muted-foreground">{inboundCallbackHealth.callbackUrl}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bot active toggle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When enabled, ChatDORA will automatically answer customer messages coming from the active WhatsApp connection mode.
            </p>
            <div className="rounded-2xl border border-border px-4 py-3">
              <Switch
                checked={botActive}
                onChange={(event) => void updateBotActive(event.target.checked)}
                disabled={pendingAction !== null}
                label="Bot active"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {isQrOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Scan WhatsApp QR</h3>
                <p className="text-sm text-muted-foreground">Scan once to connect this workspace with your WhatsApp account.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsQrOpen(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm">
                Status: <span className="font-medium">{currentStatus.replace("_", " ")}</span>
              </div>
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 p-6">
                {qrCode ? (
                  <Image
                    src={qrCode}
                    alt="WhatsApp QR code"
                    width={288}
                    height={288}
                    className="h-auto w-full max-w-[18rem] rounded-2xl bg-white p-3"
                    unoptimized
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">QR is still initializing. Try again in a few seconds.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
