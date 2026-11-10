import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = "https://lweonmkbcdquseexcjij.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ICfctOXgC77sgd2o1TvQqQ_S6S0oMq8";

const OWNER_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

// System & Management routes restricted strictly to Admin, Moderator, and Owner:
const RESTRICTED_SYSTEM_ROUTES = [
  "/dashboard/admin",
  "/dashboard/sync",
  "/dashboard/collaborate",
  "/dashboard/shares",
  "/dashboard/apps",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/api/records") ||
    request.nextUrl.pathname.startsWith("/api/share-links");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Strict RBAC Guard: If customer attempts to access system management, block and redirect immediately to /dashboard
  if (user && RESTRICTED_SYSTEM_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))) {
    const email = user.email || "";
    const isOwner = OWNER_EMAILS.includes(email);
    const role =
      (user.user_metadata?.role as string) || (user.user_metadata?.display_name === "shyamvsp" ? "admin" : "customer");
    const isPrivileged = isOwner || role === "admin" || role === "moderator";

    if (!isPrivileged) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|share/|.*\\.apk).*)"],
};
