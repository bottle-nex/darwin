export const ADMIN_TOKEN_COOKIE = "darwin_admin_token";
export const EMAIL_COOKIE = "darwin_admin_email";

const MAX_AGE_SECONDS = 12 * 60 * 60;

function read(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function write(name: string, value: string) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function drop(name: string) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default class AdminSession {
    static get_token(): string | null {
        return read(ADMIN_TOKEN_COOKIE);
    }

    static get_email(): string | null {
        return read(EMAIL_COOKIE);
    }

    static set(token: string, email: string) {
        write(ADMIN_TOKEN_COOKIE, token);
        write(EMAIL_COOKIE, email);
    }

    static clear() {
        drop(ADMIN_TOKEN_COOKIE);
        drop(EMAIL_COOKIE);
    }

    static is_authenticated(): boolean {
        return Boolean(this.get_token());
    }
}
