import { ENV } from "../configs/env";

export default class AdminService {
    static is_allowed(email: string): boolean {
        return ENV.SERVER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
    }

    static readonly OTP_NAMESPACE = "admin";
}
