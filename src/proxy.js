import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

function redirectWithCookies(request, response, pathname) {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = "";
  destination.hash = "";

  const redirectResponse = NextResponse.redirect(destination);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = ["/contacts", "/campaigns"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, response, "/login");
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

export const config = {
  matcher: ["/login", "/contacts/:path*", "/campaigns/:path*"],
};