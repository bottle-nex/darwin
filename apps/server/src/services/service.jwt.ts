import jwt, { type SignOptions } from "jsonwebtoken";
import { ENV } from "../configs/env";

/**
 * Claims embedded in a session token.
 *
 * @property sub - The authenticated user's id (standard JWT subject claim).
 * @property email - The user's verified email address.
 */
export interface SessionClaims {
    sub: string;
    email: string;
}

/**
 * Sign a session JWT for an authenticated user.
 *
 * Uses HS256 with `SERVER_JWT_SECRET` and expires after `SERVER_JWT_TOKEN_TTL`.
 *
 * @param claims - The {@link SessionClaims} to encode into the token.
 * @returns The signed, compact-serialized JWT string.
 */
export function signSessionJwt(claims: SessionClaims): string {
    return jwt.sign(claims, ENV.SERVER_JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_JWT_TOKEN_TTL as SignOptions["expiresIn"],
    });
}

/**
 * Verify and decode a session JWT.
 *
 * Validates the HS256 signature and expiry against `SERVER_JWT_SECRET`, then asserts
 * the payload shape so callers receive a fully-typed {@link SessionClaims}.
 *
 * @param token - The compact JWT string to verify.
 * @returns The decoded {@link SessionClaims}.
 * @throws If the signature/expiry is invalid, or the payload is missing `sub`/`email`.
 */
export function verifySessionJwt(token: string): SessionClaims {
    const payload = jwt.verify(token, ENV.SERVER_JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (typeof payload !== "object" || payload === null) {
        throw new Error("invalid token payload");
    }

    const { sub, email } = payload as Record<string, unknown>;
    if (typeof sub !== "string" || typeof email !== "string") {
        throw new Error("missing sub or email claim");
    }

    return { sub, email };
}
