import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/session";

export function proxy(request: NextRequest) {
    const signedIn = Boolean(request.cookies.get(ADMIN_TOKEN_COOKIE)?.value);
    const onLogin = request.nextUrl.pathname === "/login";

    if (!signedIn && !onLogin) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (signedIn && onLogin) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
