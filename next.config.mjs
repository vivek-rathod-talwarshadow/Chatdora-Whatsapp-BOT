/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky filesystem cache ENOENT issues on Windows during local dev.
      config.cache = false;
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: "/Whatsapp-web-bot/api/inbound-message/",
        destination: "/api/inbound-message"
      },
      {
        source: "/Whatsapp-web-bot/api/inbound-message",
        destination: "/api/inbound-message"
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
