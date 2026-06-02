"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type ExtendedNavigator = Navigator & {
  standalone?: boolean;
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
  vibrate?: (pattern: number | number[]) => boolean;
};

type NativeAppContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  supportsNotifications: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  supportsVibration: boolean;
  supportsBadging: boolean;
  supportsShare: boolean;
  requestInstall: () => Promise<void>;
  requestNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  triggerHaptic: (pattern?: number | number[]) => void;
  shareApp: () => Promise<void>;
};

const NativeAppContext = createContext<NativeAppContextValue | null>(null);

async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("Service worker registration failed", error);
    return null;
  }
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = navigator as ExtendedNavigator;
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");

  const supportsNotifications = typeof window !== "undefined" && "Notification" in window;
  const supportsVibration = typeof window !== "undefined" && "vibrate" in navigator;
  const supportsBadging = typeof window !== "undefined" && "setAppBadge" in navigator;
  const supportsShare = typeof window !== "undefined" && "share" in navigator;

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setNotificationPermission(supportsNotifications ? Notification.permission : "unsupported");

    void registerServiceWorker();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
      toast("Install ready", {
        description: "You can now install ChatDora as an app from the account page."
      });
    };

    const onInstalled = async () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setIsInstalled(true);
      triggerHaptic([30, 30, 30]);
      toast.success("App installed", {
        description: "ChatDora is now available from your home screen or app drawer."
      });

      const nav = navigator as ExtendedNavigator;
      await nav.clearAppBadge?.();
    };

    const onDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    const onOnline = () => {
      triggerHaptic(20);
      toast.success("Back online", {
        description: "Realtime features and sync are available again."
      });
    };

    const onOffline = () => {
      triggerHaptic([40, 30, 40]);
      toast("Offline mode", {
        description: "You can keep browsing cached screens while the network is unavailable."
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("button, a, [role='button'], input, select, textarea, summary")) {
        triggerHaptic(10);
      }
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    mediaQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("pointerup", onPointerUp);
      mediaQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, [supportsNotifications]);

  function triggerHaptic(pattern: number | number[] = 16) {
    const nav = navigator as ExtendedNavigator;
    nav.vibrate?.(pattern);
  }

  async function requestInstall() {
    const prompt = deferredPromptRef.current;
    if (!prompt) {
      toast("Install not available", {
        description: "Use Chrome or Edge on mobile/desktop, then open this page over HTTPS."
      });
      return;
    }

    triggerHaptic([18, 24, 18]);
    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === "accepted") {
      setCanInstall(false);
      deferredPromptRef.current = null;
    }
  }

  async function requestNotifications() {
    if (!supportsNotifications) {
      toast.error("Notifications unsupported", {
        description: "This browser does not expose the Web Notifications API."
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      triggerHaptic([24, 20, 24]);
      toast.success("Notifications enabled", {
        description: "ChatDora can now send local device notifications."
      });
      await sendTestNotification();
      return;
    }

    toast("Notifications blocked", {
      description: "Browser permission is still required before alerts can appear."
    });
  }

  async function sendTestNotification() {
    if (!supportsNotifications || Notification.permission !== "granted") {
      toast("Allow notifications first", {
        description: "Enable notification access to send a device alert."
      });
      return;
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      toast.error("Notification setup failed", {
        description: "The service worker did not register, so device alerts cannot be shown yet."
      });
      return;
    }

    const nav = navigator as ExtendedNavigator;

    const options: NotificationOptions & {
      vibrate?: number[];
    } = {
      body: "Installed app features like alerts, vibration, and app shortcuts are active.",
      icon: "/pwa/install-icon-192.png",
      badge: "/pwa/install-icon-192.png",
      tag: "chatdora-native-test",
      vibrate: [120, 60, 120],
      data: {
        url: "/dashboard/account"
      }
    };

    await registration.showNotification("ChatDora is ready", options);

    triggerHaptic([30, 40, 30]);
    await nav.setAppBadge?.(1);
    toast.success("Test notification sent", {
      description: "Check your device tray or desktop notification center."
    });
  }

  async function shareApp() {
    if (!supportsShare) {
      toast("Share unavailable", {
        description: "This browser does not support the native share sheet."
      });
      return;
    }

    try {
      await navigator.share({
        title: "ChatDora",
        text: "Install ChatDora for a native-style WhatsApp bot dashboard.",
        url: window.location.origin
      });
      triggerHaptic(18);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed", error);
      }
    }
  }

  return (
    <NativeAppContext.Provider
      value={{
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
      }}
    >
      {children}
    </NativeAppContext.Provider>
  );
}

export function useNativeApp() {
  const context = useContext(NativeAppContext);

  if (!context) {
    throw new Error("useNativeApp must be used within NativeAppProvider");
  }

  return context;
}
