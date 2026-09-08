import jwt, { type SignOptions } from "jsonwebtoken";

import { ENV } from "../configs/env";
import type { AuthUser } from "../types/express";

/**
 * Sign a session JWT for an authenticated user.
 *
 * Uses HS256 with `JWT_SECRET` and expires after `SERVER_JWT_TOKEN_TTL`.
 */
export function signSessionJwt(claims: AuthUser): string {
    return jwt.sign(claims, ENV.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_JWT_TOKEN_TTL as SignOptions["expiresIn"],
    });
}

/**
 * Verify and decode a session JWT.
 *
 * Validates the HS256 signature and expiry against `JWT_SECRET`, then asserts
 * the payload shape so callers receive a fully-typed {@link AuthUser}. Throws if the
 * signature/expiry is invalid or the payload is missing its `id`/`email` claims.
 */
export function verifySessionJwt(token: string): AuthUser {
    const payload = jwt.verify(token, ENV.JWT_SECRET, {
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

export interface AdminClaims {
    email: string;
    scope: "admin";
}

export function signAdminJwt(email: string): string {
    return jwt.sign({ email, scope: "admin" } satisfies AdminClaims, ENV.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_ADMIN_JWT_TTL as SignOptions["expiresIn"],
    });
}

export function verifyAdminJwt(token: string): AdminClaims {
    const payload = jwt.verify(token, ENV.JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (typeof payload !== "object" || payload === null) {
        throw new Error("invalid token payload");
    }

    const { email, scope } = payload as Record<string, unknown>;
    if (typeof email !== "string" || scope !== "admin") {
        throw new Error("not an admin token");
    }

    return { email, scope: "admin" };
}

export interface SandboxClaims {
    session_id: string;
}

/**
 * Sign a short-lived JWT scoped to one SetupSession — handed to the E2B sandbox as
 * DARWIN_SANDBOX_TOKEN so sandbox-mcp can call back in without a user session.
 */
export function signSandboxJwt(session_id: string): string {
    return jwt.sign({ session_id } satisfies SandboxClaims, ENV.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_SANDBOX_JWT_TTL as SignOptions["expiresIn"],
    });
}

export function verifySandboxJwt(token: string): SandboxClaims {
    const payload = jwt.verify(token, ENV.JWT_SECRET, {
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

export interface WorkerClaims {
    worker_id: string;
}

/**
 * Sign a short-lived JWT scoped to one Worker — handed to the E2B sandbox as
 * DARWIN_SANDBOX_TOKEN so sandbox-mcp can report status/PR outcome without a user session.
 */
export function signWorkerJwt(worker_id: string): string {
    return jwt.sign({ worker_id } satisfies WorkerClaims, ENV.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.WORKER_JWT_TTL as SignOptions["expiresIn"],
    });
}

export function verifyWorkerJwt(token: string): WorkerClaims {
    const payload = jwt.verify(token, ENV.JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (typeof payload !== "object" || payload === null) {
        throw new Error("invalid token payload");
    }

    const { worker_id } = payload as Record<string, unknown>;
    if (typeof worker_id !== "string") {
        throw new Error("missing worker_id claim");
    }

    return { worker_id };
}
