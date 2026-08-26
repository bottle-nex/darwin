import { createHash } from "node:crypto";

import { PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN } from "@trymatcha/types";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { ENV } from "../configs/env";

const REPLAY_CAPABILITY_TTL_SECONDS = 5 * 60;
const REPLAY_CONTENT_HOST_PREFIX = "content-";
const replay_capability_input_schema = z
    .object({
        productDiffId: z.string().min(1).max(100),
        projectId: z.string().min(1).max(100),
        artifactId: z.string().regex(PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN),
    })
    .strict();

const replay_capability_schema = replay_capability_input_schema
    .extend({ exp: z.number().int().positive() })
    .strict();

export type ReplayCapability = z.infer<typeof replay_capability_schema>;
export type ReplayCapabilityInput = z.infer<typeof replay_capability_input_schema>;

export default class ReplayAccess {
    static is_configured(): boolean {
        return Boolean(
            ENV.SERVER_PRODUCT_DIFF_REPLAY_ENABLED && ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN,
        );
    }

    static issue(input: ReplayCapabilityInput): string {
        const claims = replay_capability_input_schema.parse(input);
        return jwt.sign(
            { ...claims, exp: Math.floor(Date.now() / 1000) + REPLAY_CAPABILITY_TTL_SECONDS },
            ENV.SERVER_JWT_SECRET,
            { algorithm: "HS256", noTimestamp: true },
        );
    }

    static async verify(token: string, expected_artifact_id?: string): Promise<ReplayCapability> {
        const payload = jwt.verify(token, ENV.SERVER_JWT_SECRET, { algorithms: ["HS256"] });
        const claims = replay_capability_schema.parse(payload);
        if (expected_artifact_id && claims.artifactId !== expected_artifact_id) {
            throw new Error("Replay capability is scoped to another artifact");
        }
        return claims;
    }

    static artifact_origin(product_diff_id: string, artifact_id: string): URL {
        if (!ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN) {
            throw new Error("Product Diff replay origin is not configured");
        }
        const origin = new URL(ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN);
        const artifact_host = createHash("sha256")
            .update(`${product_diff_id}\0${artifact_id}`)
            .digest("hex")
            .slice(0, 52);
        origin.hostname = `${artifact_host}.${origin.hostname}`;
        return origin;
    }

    static artifact_content_origin(product_diff_id: string, artifact_id: string): URL {
        const origin = this.artifact_origin(product_diff_id, artifact_id);
        origin.hostname = `${REPLAY_CONTENT_HOST_PREFIX}${origin.hostname}`;
        return origin;
    }

    static launch_url(token: string, artifact_id: string): string {
        const claims = replay_capability_schema.parse(
            jwt.verify(token, ENV.SERVER_JWT_SECRET, { algorithms: ["HS256"] }),
        );
        if (claims.artifactId !== artifact_id) {
            throw new Error("Replay capability is scoped to another artifact");
        }
        const launch = this.artifact_origin(claims.productDiffId, artifact_id);
        launch.searchParams.set("capability", token);
        return launch.toString();
    }

    static host_matches(
        host: string | undefined,
        product_diff_id: string,
        artifact_id: string,
    ): boolean {
        return (
            host?.toLowerCase() ===
            this.artifact_origin(product_diff_id, artifact_id).host.toLowerCase()
        );
    }

    static content_host_matches(
        host: string | undefined,
        product_diff_id: string,
        artifact_id: string,
    ): boolean {
        return (
            host?.toLowerCase() ===
            this.artifact_content_origin(product_diff_id, artifact_id).host.toLowerCase()
        );
    }

    static is_replay_host(host: string | undefined): boolean {
        if (!host || !ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN) return false;
        const replay_origin = new URL(ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN);
        try {
            const candidate = new URL(`${replay_origin.protocol}//${host}`);
            const replay_hostname = replay_origin.hostname.toLowerCase().replace(/\.$/, "");
            const suffix = `.${replay_hostname}`;
            const hostname = candidate.hostname.toLowerCase().replace(/\.$/, "");
            if (!hostname.endsWith(suffix)) return false;
            return /^(?:content-)?[a-f0-9]{52}$/.test(hostname.slice(0, -suffix.length));
        } catch {
            return false;
        }
    }
}
