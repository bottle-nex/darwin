import Logger from "@trymatcha/logger";
import { RunLogPhase } from "@trymatcha/types";
import { z } from "zod";

import { ENV } from "../conf/config.env";
import RunLogRegistry from "../services/run_log/service.registry";

const log = Logger.scope("run-log-http");

const body_schema = z.object({
    run_id: z.string().min(1),
    seq: z.number().int().min(1),
    event: z.looseObject({ kind: z.string().min(1) }),
});

function bearer(request: Request): string | null {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice("Bearer ".length).trim() || null;
}

async function handle_run_log(request: Request): Promise<Response> {
    const token = bearer(request);
    if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: "invalid body" }, { status: 400 });
    }

    const parsed = body_schema.safeParse(payload);
    if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });

    const writer = RunLogRegistry.resolve(parsed.data.run_id, token);
    if (!writer) return Response.json({ error: "unknown run" }, { status: 404 });

    try {
        const result = await writer.write(RunLogPhase.Agent, parsed.data.seq, parsed.data.event);
        if (result === "unsupported") {
            return Response.json({ error: "unsupported event" }, { status: 400 });
        }
        return Response.json({ stored: parsed.data.seq, result });
    } catch (error) {
        log.error("run log write failed", { run: parsed.data.run_id, error });
        return Response.json({ error: "not stored" }, { status: 503 });
    }
}

export function start_run_log_server() {
    const server = Bun.serve({
        port: ENV.SERVER_VM_HTTP_PORT,
        async fetch(request) {
            const { pathname } = new URL(request.url);
            if (pathname === "/health") return Response.json({ ok: true });
            if (pathname === "/run-logs" && request.method === "POST") {
                return handle_run_log(request);
            }
            return Response.json({ error: "not found" }, { status: 404 });
        },
    });

    log.info("listening for sandbox reports", { port: server.port });
    return server;
}
