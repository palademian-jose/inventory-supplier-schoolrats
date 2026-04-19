import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internals, and public API paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/) ||
    isPublic(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("inventory_token")?.value;

  if (!token) {
    // API routes get 401 JSON; pages get redirected to /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "change-this-secret");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token expired or invalid
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
