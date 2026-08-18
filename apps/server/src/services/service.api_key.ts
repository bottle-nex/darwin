import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const KEY_PREFIX = "mch_live_";
const PREFIX_LENGTH = KEY_PREFIX.length + 8;

export default class ApiKeyService {
    static generate_key(): { raw: string; prefix: string } {
        const raw = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
        return { raw, prefix: raw.slice(0, PREFIX_LENGTH) };
    }

    static prefix_of(raw: string): string {
        return raw.slice(0, PREFIX_LENGTH);
    }

    static async hash_key(raw: string): Promise<string> {
        return bcrypt.hash(raw, 10);
    }

    static async verify_key(raw: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(raw, hashed);
    }
}
