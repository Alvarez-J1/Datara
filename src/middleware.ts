import { NextResponse, type NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const isAuthenticated =
    request.cookies.get("datara-demo-mode")?.value === "true" ||
    request.cookies.get("datara-authenticated")?.value === "true";

  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
