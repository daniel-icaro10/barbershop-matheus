import { NextRequest, NextResponse } from "next/server"

// Edge middleware: fast pre-check before hitting server components.
// Full role validation still happens inside requireAdmin() — this is
// defense-in-depth only (blocks unauthenticated requests early).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    // Better Auth stores session in "better-auth.session_token" cookie
    const session =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token")

    if (!session?.value) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
