import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { NativeAppProvider } from "@/components/pwa/native-app-provider";
import { getAppUrl } from "@/lib/config";
import "./globals.css";

const appUrl = getAppUrl();

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ChatDora | WhatsApp Bot for Business, AI Auto Replies & FAQ Automation",
    template: "%s | ChatDora"
  },
  description:
    "ChatDora is a WhatsApp bot platform for local businesses with AI auto replies, FAQ automation, lead capture, contacts, CRM tools, and WhatsApp dashboard management.",
  applicationName: "ChatDora",
  manifest: "/manifest.webmanifest",
  keywords: [
    "ChatDora",
    "chatdora",
    "WhatsApp bot",
    "WhatsApp bot for business",
    "AI WhatsApp bot",
    "WhatsApp automation",
    "WhatsApp auto reply bot",
    "WhatsApp FAQ bot",
    "WhatsApp chatbot for local business",
    "lead capture WhatsApp bot",
    "customer support WhatsApp bot",
    "WhatsApp CRM for small business"
  ],
  alternates: {
    canonical: appUrl
  },
  icons: {
    icon: "/dora-logo.png",
    shortcut: "/dora-logo.png",
    apple: "/dora-logo.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChatDora"
  },
  formatDetection: {
    telephone: false
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "ChatDora | WhatsApp Bot for Business and AI Auto Replies",
    description: "AI WhatsApp bot for local businesses with FAQ automation, instant replies, lead capture, and dashboard controls.",
    url: appUrl,
    siteName: "ChatDora",
    images: [
      {
        url: "/dora-logo.png",
        width: 512,
        height: 512,
        alt: "ChatDora logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatDora | WhatsApp Bot for Business and AI Auto Replies",
    description: "AI WhatsApp bot for local businesses with FAQ automation, instant replies, lead capture, and dashboard controls.",
    images: ["/dora-logo.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#0f6b4a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable} font-[var(--font-manrope)]`}>
        <NativeAppProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NativeAppProvider>
      </body>
    </html>
  );
}
