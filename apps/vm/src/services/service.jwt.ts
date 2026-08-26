import jwt, { type SignOptions } from "jsonwebtoken";

import { ENV } from "../conf/config.env";

/**
 * Mints the same worker-scoped JWT shape the server verifies (see
 * apps/server/src/services/service.jwt.ts::verifyWorkerJwt). Signed here, not
 * requested from the server, because the vm app is the one booting the sandbox and
 * needs the token before the sandbox can make its first call back.
 */
export function sign_worker_jwt(worker_id: string): string {
    return jwt.sign({ worker_id }, ENV.SERVER_JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ENV.SERVER_WORKER_JWT_TTL as SignOptions["expiresIn"],
    });
}
