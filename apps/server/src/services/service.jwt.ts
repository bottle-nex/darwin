import jwt, { type SignOptions } from "jsonwebtoken";
import { ENV } from "../configs/env";
import { AuthUser } from "../types/express";

/**
 * Sign a session JWT for an authenticated user.
 *
 * Uses HS256 with `SERVER_JWT_SECRET` and expires after `SERVER_JWT_TOKEN_TTL`.
 */
export function signSessionJwt(claims: AuthUser): string {
    return jwt.sign(claims, ENV.SERVER_JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_JWT_TOKEN_TTL as SignOptions["expiresIn"],
    });
}

/**
 * Verify and decode a session JWT.
 *
 * Validates the HS256 signature and expiry against `SERVER_JWT_SECRET`, then asserts
 * the payload shape so callers receive a fully-typed {@link AuthUser}. Throws if the
 * signature/expiry is invalid or the payload is missing its `id`/`email` claims.
 */
export function verifySessionJwt(token: string): AuthUser {
    const payload = jwt.verify(token, ENV.SERVER_JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (typeof payload !== "object" || payload === null) {
        throw new Error("invalid token payload");
    }

    const { id, name, email } = payload as Record<string, unknown>;
    if (typeof id !== "string" || typeof email !== "string") {
        throw new Error("missing id or email claim");
    }

    return { id, name: typeof name === "string" ? name : "", email };
}

export interface SandboxClaims {
    session_id: string;
}

/**
 * Sign a short-lived JWT scoped to one SetupSession — handed to the E2B sandbox as
 * MATCHA_SANDBOX_TOKEN so sandbox-mcp can call back in without a user session.
 */
export function signSandboxJwt(session_id: string): string {
    return jwt.sign({ session_id } satisfies SandboxClaims, ENV.SERVER_JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_SANDBOX_JWT_TTL as SignOptions["expiresIn"],
    });
}

export function verifySandboxJwt(token: string): SandboxClaims {
    const payload = jwt.verify(token, ENV.SERVER_JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (typeof payload !== "object" || payload === null) {
        throw new Error("invalid token payload");
    }

    const { session_id } = payload as Record<string, unknown>;
    if (typeof session_id !== "string") {
        throw new Error("missing session_id claim");
    }

    return { session_id };
}
