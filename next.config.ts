// Must be set before any Date operations. Also set TZ=America/Sao_Paulo in Vercel env vars.
process.env.TZ = "America/Sao_Paulo"

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
