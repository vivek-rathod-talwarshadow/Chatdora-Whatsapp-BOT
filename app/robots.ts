import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy-policy"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/login",
          "/signin",
          "/signup",
          "/register",
          "/verify-email"
        ]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl
  };
}
