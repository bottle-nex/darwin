import type { NextFunction, Request, Response } from "express";

import ReplayAccess from "../services/service.product_diff_replay_access";
import ResponseWriter from "../services/service.response";

const REPLAY_ROUTE = "/api/v1/replay";

function is_replay_route(url: string): boolean {
    const encoded_pathname = new URL(url, "http://matcha.internal").pathname;
    let pathname = encoded_pathname;
    try {
        pathname = decodeURIComponent(encoded_pathname);
    } catch {
        pathname = encoded_pathname;
    }
    return pathname === REPLAY_ROUTE || pathname.startsWith(`${REPLAY_ROUTE}/`);
}

export function ordinary_socket_host_allowed(host: string | undefined): boolean {
    return !ReplayAccess.is_replay_host(host);
}

export function replay_host_boundary(req: Request, res: Response, next: NextFunction) {
    if (ReplayAccess.is_replay_host(req.get("host"))) {
        if (!is_replay_route(req.url)) {
            req.url = `${REPLAY_ROUTE}${req.url === "/" ? "" : req.url}`;
        }
        next();
        return;
    }
    if (is_replay_route(req.url)) {
        ResponseWriter.not_found(res);
        return;
    }
    next();
}
