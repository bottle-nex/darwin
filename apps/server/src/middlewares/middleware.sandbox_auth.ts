import type { NextFunction, Request, Response } from "express";

import { verifySandboxJwt } from "../services/service.jwt";
import ResponseWriter from "../services/service.response";

export function require_sandbox_auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return ResponseWriter.not_authorized(res, "Missing token");
    }

    const token = header.slice(7);
    try {
        req.sandbox_session_id = verifySandboxJwt(token).session_id;
        next();
    } catch {
        return ResponseWriter.not_authorized(res, "Invalid or expired token");
    }
}
