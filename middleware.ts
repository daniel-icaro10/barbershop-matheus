import { NextRequest, NextResponse } from "next/server"

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development"

  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://utfs.io",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self'",
  ].join("; ")
}

// Edge middleware: fast pre-check before hitting server components.
// Full role validation still happens inside requireAdmin() — this is
// defense-in-depth only (blocks unauthenticated requests early).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  // Forward nonce to Server Components so Next.js can apply it to its
  // internal inline scripts (RSC streaming, hydration).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  if (pathname.startsWith("/admin")) {
    const session =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token")

    if (!session?.value) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  // Skip static files — they don't need CSP headers and the nonce would be wasted.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
