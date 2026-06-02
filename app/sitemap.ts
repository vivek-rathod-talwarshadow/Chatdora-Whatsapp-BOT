import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl().replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${appUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${appUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${appUrl}/contact-us`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${appUrl}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
