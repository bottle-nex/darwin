const TOKEN_KEY = "matcha_admin_token";
const EMAIL_KEY = "matcha_admin_email";

export default class AdminSession {
    static get_token(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    static get_email(): string | null {
        return localStorage.getItem(EMAIL_KEY);
    }

    static set(token: string, email: string) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(EMAIL_KEY, email);
    }

    static clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
    }

    static is_authenticated(): boolean {
        return Boolean(this.get_token());
    }
}
