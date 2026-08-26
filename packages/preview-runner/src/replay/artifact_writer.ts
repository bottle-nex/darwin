import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { ProductDiffManifestV4 } from "../../../types/product-diff/product-diff.contract";
import { normalizeReplayRequestUrl, redactReplayResponseHeaders } from "./resource_policy";

export type ReplayArtifactResourceKind = "asset" | "response";

export interface ReplayRequestIdentity {
    url: string;
    method: "GET" | "HEAD";
    resourceType: string;
    responseContentType: string | null;
    variantHeaders: Record<string, string | undefined>;
}

export interface ReplayArtifactResourceInput {
    request: ReplayRequestIdentity;
    responseHeaders: Record<string, string | undefined>;
    body: Uint8Array;
    kind: ReplayArtifactResourceKind;
    responseStatus?: number;
    responseStatusText?: string;
    redirectLocation?: string | null;
}

export interface ReplayWrittenResource {
    objectKey: string;
    sha256: string;
}

export interface ReplayArtifactWriterOptions {
    allowedQueryParameters?: Record<string, string[]>;
}

interface ReplayManifestResource {
    request: ReplayRequestIdentity;
    responseHeaders: Record<string, string>;
    objectKey: string;
    sha256: string;
    responseStatus: number;
    responseStatusText: string;
    redirectLocation: string | null;
}

const SAFE_REQUEST_VARIANT_HEADERS = new Set(["accept", "accept-language"]);

function normalize_headers(headers: Record<string, string | undefined>): Record<string, string> {
    if (
        Object.keys(headers).some((name) => !SAFE_REQUEST_VARIANT_HEADERS.has(name.toLowerCase()))
    ) {
        throw new Error("replay artifacts require safe request variant headers");
    }
    return Object.fromEntries(
        Object.entries(headers)
            .flatMap(([name, value]) => (value === undefined ? [] : [[name.toLowerCase(), value]]))
            .sort(([left], [right]) => left.localeCompare(right)),
    );
}

function normalize_request_identity(
    request: ReplayRequestIdentity,
    allowedQueryParameters: Record<string, string[]>,
): ReplayRequestIdentity {
    return {
        url: normalizeReplayRequestUrl(request.url, allowedQueryParameters),
        method: request.method.toUpperCase() as "GET" | "HEAD",
        resourceType: request.resourceType.toLowerCase(),
        responseContentType: request.responseContentType?.toLowerCase().split(";", 1)[0] ?? null,
        variantHeaders: normalize_headers(request.variantHeaders),
    };
}

export function replayRequestIdentityKey(
    request: ReplayRequestIdentity,
    allowedQueryParameters: Record<string, string[]> = {},
): string {
    return JSON.stringify(normalize_request_identity(request, allowedQueryParameters));
}

function redirect_location(
    value: string | null | undefined,
    request: ReplayRequestIdentity,
    allowedQueryParameters: Record<string, string[]>,
): string | null {
    if (value === null || value === undefined) return null;
    return normalizeReplayRequestUrl(
        new URL(value, request.url).toString(),
        allowedQueryParameters,
    );
}

export class ReplayArtifactWriter {
    readonly root: string;
    private readonly allowedQueryParameters: Record<string, string[]>;
    private readonly resourceHashes = new Map<string, string>();
    private readonly resources = new Map<string, ReplayManifestResource>();
    private readonly objectBytes = new Map<string, number>();

    constructor(root: string, options: ReplayArtifactWriterOptions = {}) {
        this.root = root;
        this.allowedQueryParameters = options.allowedQueryParameters ?? {};
    }

    get resourceCount(): number {
        return this.resources.size;
    }

    get packageBytes(): number {
        return [...this.objectBytes.values()].reduce((total, bytes) => total + bytes, 0);
    }

    async writeResource(resource: ReplayArtifactResourceInput): Promise<ReplayWrittenResource> {
        const request = normalize_request_identity(resource.request, this.allowedQueryParameters);
        if (request.method !== "GET" && request.method !== "HEAD") {
            throw new Error("replay artifacts only support GET and HEAD request identities");
        }

        const sha256 = createHash("sha256").update(resource.body).digest("hex");
        const identity = replayRequestIdentityKey(request, this.allowedQueryParameters);
        const existingHash = this.resourceHashes.get(identity);
        if (existingHash && existingHash !== sha256) {
            throw new Error("request identity resolved to different byte hashes");
        }

        const objectKey = `${resource.kind === "asset" ? "assets" : "responses"}/${sha256}`;
        const responseStatus = resource.responseStatus ?? 200;
        if (!Number.isInteger(responseStatus) || responseStatus < 100 || responseStatus > 599) {
            throw new Error("replay artifacts require valid response status");
        }
        const responseStatusText = (resource.responseStatusText ?? "").slice(0, 120);
        const redirectLocation = redirect_location(
            resource.redirectLocation,
            request,
            this.allowedQueryParameters,
        );
        this.write_atomic(objectKey, resource.body);
        this.objectBytes.set(objectKey, resource.body.byteLength);
        this.resourceHashes.set(identity, sha256);
        this.resources.set(identity, {
            request,
            responseHeaders: redactReplayResponseHeaders(resource.responseHeaders),
            objectKey,
            sha256,
            responseStatus,
            responseStatusText,
            redirectLocation,
        });
        return { objectKey, sha256 };
    }

    async writeManifest(
        input: Pick<
            ProductDiffManifestV4,
            "version" | "framework" | "applications" | "surfaces" | "warnings"
        > &
            Record<string, unknown>,
    ): Promise<ReplayWrittenResource> {
        if (input.version !== 4) throw new Error("replay artifact manifests require version 4");

        const body = Buffer.from(
            JSON.stringify({
                version: input.version,
                framework: input.framework,
                applications: input.applications,
                surfaces: input.surfaces,
                warnings: input.warnings,
                resources: [...this.resources.values()],
            }),
        );
        const sha256 = createHash("sha256").update(body).digest("hex");
        const objectKey = "artifact.json";
        this.write_atomic(objectKey, body);
        this.objectBytes.set(objectKey, body.byteLength);
        return { objectKey, sha256 };
    }

    private write_atomic(objectKey: string, body: Uint8Array): void {
        const path = join(this.root, objectKey);
        mkdirSync(dirname(path), { recursive: true });
        if (existsSync(path)) return;

        const temporaryPath = `${path}.${randomUUID()}.tmp`;
        try {
            writeFileSync(temporaryPath, body);
            renameSync(temporaryPath, path);
        } finally {
            if (existsSync(temporaryPath)) {
                rmSync(temporaryPath, { force: true });
            }
        }
    }
}
