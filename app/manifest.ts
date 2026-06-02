import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ChatDora",
    short_name: "ChatDora",
    description: "Native-style ChatDora dashboard for WhatsApp automation, FAQs, contacts, and lead handling.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#f6fcf8",
    theme_color: "#0f6b4a",
    orientation: "portrait",
    categories: ["business", "productivity", "utilities"],
    lang: "en-IN",
    icons: [
      {
        src: "/pwa/install-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/pwa/install-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Open dashboard",
        short_name: "Dashboard",
        description: "Jump straight into your ChatDora dashboard.",
        url: "/dashboard",
        icons: [{ src: "/pwa/install-icon-192.png", sizes: "192x192" }]
      },
      {
        name: "WhatsApp setup",
        short_name: "WhatsApp",
        description: "Open WhatsApp connection tools.",
        url: "/dashboard/whatsapp",
        icons: [{ src: "/pwa/install-icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}
