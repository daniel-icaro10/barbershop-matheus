import type { NextConfig } from "next"

// Must be set before any date-related code runs so Node.js uses São Paulo
// timezone for all Date local-getter calls (startOfDay, endOfDay, etc.)
process.env.TZ = "America/Sao_Paulo"

// CSP is set dynamically in middleware.ts (nonce-based, per-request).
const securityHeaders = [
  // 2 years; omit "preload" until domain is deliberately submitted to hstspreload.org
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
  images: {
    qualities: [75, 90, 92],
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./generated/prisma/**/*"],
  },
}

export default nextConfig
