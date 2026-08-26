import { afterAll, beforeEach, expect, test } from "bun:test";

import { ENV } from "../configs/env";
import ReplayAccess from "../services/service.product_diff_replay_access";
import { ordinary_socket_host_allowed, replay_host_boundary } from "./middleware.replay_host";

const environment = ENV as unknown as Record<string, unknown>;
const original_enabled = environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED;
const original_origin = environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN;
const artifact_id = "replay/web/billing/default/desktop/head/artifact.json";

function request(host: string, url: string) {
    return {
        url,
        headers: { host },
        get(name: string) {
            return name.toLowerCase() === "host" ? this.headers.host : undefined;
        },
    };
}

function response() {
    let status_code = 200;
    let payload: unknown;
    const res = {
        status(code: number) {
            status_code = code;
            return res;
        },
        json(next: unknown) {
            payload = next;
            return res;
        },
    };
    return { res, result: () => ({ status_code, payload }) };
}

beforeEach(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = true;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = "https://replay.trymatchausercontent.test";
});

afterAll(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = original_enabled;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = original_origin;
});

test("confines every replay-host request to the replay gateway", () => {
    const host = ReplayAccess.artifact_origin("product-diff-1", artifact_id).host;
    const req = request(host, "/api/v1/auth?attempt=1");
    let continued = false;

    replay_host_boundary(req as never, response().res as never, () => {
        continued = true;
    });

    expect(continued).toBe(true);
    expect(req.url).toBe("/api/v1/replay/api/v1/auth?attempt=1");
});

test("confines replay content hosts to the replay gateway", () => {
    const host = ReplayAccess.artifact_content_origin("product-diff-1", artifact_id).host;
    const req = request(host, "/billing/details");
    let continued = false;

    replay_host_boundary(req as never, response().res as never, () => {
        continued = true;
    });

    expect(continued).toBe(true);
    expect(req.url).toBe("/api/v1/replay/billing/details");
    expect(ordinary_socket_host_allowed(host)).toBe(false);
});

test("rejects replay gateway paths on an ordinary API host", () => {
    const req = request("api.trymatcha.app", "/api/v1/replay/billing");
    const result = response();
    let continued = false;

    replay_host_boundary(req as never, result.res as never, () => {
        continued = true;
    });

    expect(continued).toBe(false);
    expect(result.result().status_code).toBe(404);
});

test("rejects encoded replay gateway paths on an ordinary API host", () => {
    const req = request("api.trymatcha.app", "/%61pi/v1/%72eplay/billing");
    const result = response();

    replay_host_boundary(req as never, result.res as never, () => undefined);

    expect(result.result().status_code).toBe(404);
});

test("leaves ordinary API paths available on an ordinary API host", () => {
    const req = request("api.trymatcha.app", "/api/v1/auth");
    let continued = false;

    replay_host_boundary(req as never, response().res as never, () => {
        continued = true;
    });

    expect(continued).toBe(true);
    expect(req.url).toBe("/api/v1/auth");
});

test("rejects ordinary WebSocket handling on replay hosts", () => {
    const replay_host = ReplayAccess.artifact_origin("product-diff-1", artifact_id).host;

    expect(ordinary_socket_host_allowed(replay_host)).toBe(false);
    expect(ordinary_socket_host_allowed(`${replay_host}.:444`)).toBe(false);
    expect(ordinary_socket_host_allowed("api.trymatcha.app")).toBe(true);
});
