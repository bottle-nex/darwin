import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { redis } from "./service.redis";
import { ENV } from "../configs/env";

/**
 * Outcome of an OTP verification attempt.
 *
 * - `{ ok: true }` — the supplied code matched and has been consumed.
 * - `reason: "expired"` — no active code exists for the email (never issued, TTL elapsed, or already used).
 * - `reason: "invalid"` — a code exists but the supplied digits did not match.
 * - `reason: "locked"` — the attempt ceiling was hit; the code has been destroyed and a new one must be requested.
 */
export type OtpVerifyResult =
    | { ok: true }
    | { ok: false; reason: "expired" | "invalid" | "locked" };

/**
 * Stateless helper around the Redis-backed OTP lifecycle.
 *
 * Each email owns three short-lived keys: the bcrypt-hashed code, a failed-attempt
 * counter, and a cooldown marker that throttles how often a new code can be requested.
 * All methods are static; the class is purely a namespace.
 */
export default class OtpService {
    /**
     * Hash `code` and persist it as the active OTP for `email`, atomically resetting
     * any prior attempt counter and (re)arming the request cooldown.
     *
     * Runs as a single `MULTI` so the three keys never drift out of sync. The code is
     * stored as a bcrypt hash (never plaintext) and expires after `SERVER_OTP_TTL_SECONDS`.
     *
     * @param email - Recipient address; callers should pass it already lowercased.
     * @param code - The plaintext 6-digit code to hash and store.
     */
    static async store_otp(email: string, code: string): Promise<void> {
        const hash = await bcrypt.hash(code, 10);
        await redis
            .multi()
            .set(this.code_key(email), hash, "EX", ENV.SERVER_OTP_TTL_SECONDS)
            .del(this.attempts_key(email))
            .set(this.cool_down_key(email), "1", "EX", ENV.SERVER_OTP_COOLDOWN_SECONDS)
            .exec();
    }

    /**
     * Check `code` against the stored OTP for `email`, enforcing the attempt ceiling.
     *
     * Increments the failed-attempt counter on every call. Once it exceeds
     * `SERVER_OTP_MAX_ATTEMPTS` the code, counter, and cooldown are destroyed and
     * `"locked"` is returned — clearing the cooldown so the user can immediately
     * request a fresh code as the response instructs. On a correct match the code,
     * counter, and cooldown are all cleared and
     * `{ ok: true }` is returned, so a code is single-use and the just-verified user is
     * not throttled if they need a new one. The bcrypt comparison runs only after the
     * lock check, meaning the lock takes precedence even if the final guess is correct.
     *
     * @param email - Address the code was issued to; pass it already lowercased.
     * @param code - The plaintext code supplied by the user.
     * @returns An {@link OtpVerifyResult} describing success or the failure reason.
     */
    static async verify_otp(email: string, code: string): Promise<OtpVerifyResult> {
        const hash = await redis.get(this.code_key(email));
        if (!hash) {
            return { ok: false, reason: "expired" };
        }

        const attempts = await redis.incr(this.attempts_key(email));
        if (attempts === 1) {
            await redis.expire(this.attempts_key(email), ENV.SERVER_OTP_TTL_SECONDS);
        }

        if (attempts > ENV.SERVER_OTP_MAX_ATTEMPTS) {
            await redis
                .pipeline()
                .del(this.code_key(email))
                .del(this.attempts_key(email))
                .del(this.cool_down_key(email))
                .exec();
            return { ok: false, reason: "locked" };
        }

        const matches = await bcrypt.compare(code, hash);
        if (!matches) {
            return { ok: false, reason: "invalid" };
        }

        await redis
            .pipeline()
            .del(this.code_key(email))
            .del(this.attempts_key(email))
            .del(this.cool_down_key(email))
            .exec();
        return { ok: true };
    }

    /**
     * Whether `email` is still within the post-request cooldown window and should be
     * refused a new code. Set by {@link store_otp}, expires after `SERVER_OTP_COOLDOWN_SECONDS`.
     *
     * @param email - Address to check; pass it already lowercased.
     * @returns `true` while the cooldown key exists, `false` once it has expired.
     */
    static async is_cooldown(email: string): Promise<boolean> {
        return (await redis.exists(this.cool_down_key(email))) === 1;
    }

    /**
     * Generate a cryptographically-random 6-digit code as a zero-padded string.
     *
     * Uses `crypto.randomInt` (not `Math.random`) and pads so values below 100000
     * keep their leading zeros — the full `"000000"`–`"999999"` range is valid.
     *
     * @returns A 6-character numeric string.
     */
    static generate_otp(): string {
        return randomInt(0, 1_000_000).toString().padStart(6, "0");
    }

    /** Redis key holding the bcrypt-hashed active code for `email`. */
    static code_key(email: string) {
        return `otp:${email.toLowerCase()}`;
    }

    /** Redis key holding the failed-attempt counter for `email`. */
    static attempts_key(email: string) {
        return `otp:${email.toLowerCase()}:attempts`;
    }

    /** Redis key marking that `email` is within its request cooldown window. */
    static cool_down_key(email: string) {
        return `otp:${email.toLowerCase()}:cooldown`;
    }
}
