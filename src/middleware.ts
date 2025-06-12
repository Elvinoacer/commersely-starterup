// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isMatchingPath } from "./matching-pattern";
import { API_ROUTES } from "./utils/api";

export const publicRoutes = [
  "/auth/register",
  "/auth/login",
  "/",
  // "/listing",
  // "/listing/:path*",
  "/others",
  "/about",
  "/terms",
  "/privacy",
  "/contact",
  "/faq",
  "/shipping",
  "/returns",
];
const superAdminRoutes = ["/super-admin", "/super-admin/:path*"];
const userRoutes = ["/home", "/listing"];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));
      const { role } = payload as { role: string };

      if (role === "SUPER_ADMIN" && userRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      if (role !== "SUPER_ADMIN" && superAdminRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Token verification failed", e);
      // Attempt to refresh the token
      // In your middleware.ts
      const refreshResponse = await fetch(`${API_ROUTES.AUTH}/refresh-token`, {
        method: "POST",
        credentials: "include", // This is correct
        headers: {
          "Content-Type": "application/json",
          // Add this to ensure cookies are sent
          Cookie: request?.cookies?.toString(),
        },
      });

      if (refreshResponse.ok) {
        // Clone the response to modify cookies
        const response = NextResponse.next();
        // The refreshed cookies should be automatically set by the browser
        return response;
      } else {
        // Refresh failed, redirect to login
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
  }

  // Redirect to login for non-public routes
  if (!publicRoutes.some((pubr) => isMatchingPath(pubr, pathname))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
