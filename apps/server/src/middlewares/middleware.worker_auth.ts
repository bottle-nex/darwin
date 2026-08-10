import type { Request, Response, NextFunction } from "express";
import { verifyWorkerJwt } from "../services/service.jwt";
import ResponseWriter from "../services/service.response";

export function require_worker_auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return ResponseWriter.not_authorized(res, "Missing token");
    }

    const token = header.slice(7);
    try {
        req.worker_id = verifyWorkerJwt(token).worker_id;
        next();
    } catch {
        return ResponseWriter.not_authorized(res, "Invalid or expired token");
    }
}
