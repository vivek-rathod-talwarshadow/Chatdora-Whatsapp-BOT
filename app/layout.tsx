import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { getAppUrl } from "@/lib/config";
import "@/lib/whatsapp/bootstrap";
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
  title: "ChatDora | AI WhatsApp Bot for Local Shops",
  description:
    "ChatDora helps local businesses automate WhatsApp replies. Start free, then upgrade to Plus for FAQs, CRM, contacts, and logs.",
  applicationName: "ChatDora",
  icons: {
    icon: "/dora-logo.png",
    shortcut: "/dora-logo.png",
    apple: "/dora-logo.png"
  },
  openGraph: {
    title: "ChatDora",
    description: "AI WhatsApp Bot for local shops",
    url: appUrl,
    siteName: "ChatDora"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable} font-[var(--font-manrope)]`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
