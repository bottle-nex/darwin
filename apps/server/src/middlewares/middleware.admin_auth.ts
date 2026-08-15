import type { Request, Response, NextFunction } from "express";
import { verifyAdminJwt } from "../services/service.jwt";
import AdminService from "../services/service.admin";
import ResponseWriter from "../services/service.response";

export function require_admin(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return ResponseWriter.not_authorized(res, "Missing token");
    }

    const token = header.slice(7);
    try {
        const claims = verifyAdminJwt(token);
        if (!AdminService.is_allowed(claims.email)) {
            return ResponseWriter.not_authorized(res, "Not an admin");
        }
        req.admin_email = claims.email;
        next();
    } catch {
        return ResponseWriter.not_authorized(res, "Invalid or expired token");
    }
}
