import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "./src/lib/adminAuth";

export async function middleware(req: NextRequest) {
  const rawPath = req.nextUrl.pathname;
  const pathname = rawPath !== "/" ? rawPath.replace(/\/+$/g, "") : rawPath;
  const isLogin = pathname === "/admin/login";

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !isLogin) {
    try {
      const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
      const ok = token ? await verifyAdminToken(token) : null;

      if (!ok) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
