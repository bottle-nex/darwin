import type { Request, Response, NextFunction } from "express";
import { prisma } from "@trymatcha/database";
import ApiKeyService from "../services/service.api_key";
import ResponseWriter from "../services/service.response";

export async function require_api_key(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const header_key = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const path_key = typeof req.params.key === "string" ? req.params.key : undefined;
    const raw_key = header_key ?? path_key;

    if (!raw_key) {
        return ResponseWriter.not_authorized(res, "Missing api key");
    }

    const prefix = ApiKeyService.prefix_of(raw_key);

    const api_key = await prisma.apiKey.findUnique({
        where: { prefix },
        select: {
            id: true,
            hashedKey: true,
            revokedAt: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });

    if (!api_key || api_key.revokedAt) {
        return ResponseWriter.not_authorized(res, "Invalid or revoked api key");
    }

    const matches = await ApiKeyService.verify_key(raw_key, api_key.hashedKey);
    if (!matches) {
        return ResponseWriter.not_authorized(res, "Invalid or revoked api key");
    }

    req.user = {
        id: api_key.user.id,
        name: api_key.user.name ?? "",
        email: api_key.user.email,
    };

    prisma.apiKey
        .update({ where: { id: api_key.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});

    next();
}
