import { posix } from "node:path";
import { pipeline } from "node:stream/promises";

import { prisma } from "@trymatcha/database";
import {
    is_replay_product_diff_manifest,
    type ProductDiffManifest,
    replayArtifactKeys,
} from "@trymatcha/types";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { ENV } from "../../configs/env";
import ReplayAccess, {
    type ReplayCapability,
} from "../../services/service.product_diff_replay_access";
import {
    replay_body_requires_rewrite,
    replay_content_security_policy,
    replay_delivery_path,
    replay_delivery_shell,
    replay_original_url,
    replay_shell_content_security_policy,
    rewrite_replay_delivery_body,
} from "../../services/service.product_diff_replay_delivery";
import ResponseWriter from "../../services/service.response";
import StorageService from "../../services/service.storage";

const REPLAY_CAPABILITY_COOKIE = "__Host-matcha_replay_capability";
const LOCAL_REPLAY_CAPABILITY_COOKIE = "matcha_replay_capability";
const MAX_REPLAY_MANIFEST_BYTES = 5_000_000;
const MAX_REPLAY_RESOURCE_BYTES = 50_000_000;

const replay_resource_schema = z
    .object({
        request: z
            .object({
                url: z.url({ protocol: /^https?$/ }),
                method: z.enum(["GET", "HEAD"]),
                resourceType: z.string().min(1).max(100),
                responseContentType: z.string().max(200).nullable(),
                variantHeaders: z.record(z.string(), z.string().max(1_000)),
            })
            .strict(),
        responseHeaders: z.record(z.string(), z.string().max(2_000)),
        objectKey: z.string().regex(/^(assets|responses)\/[a-f0-9]{64}$/),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        responseStatus: z.number().int().min(100).max(599),
        responseStatusText: z.string().max(120),
        redirectLocation: z.url({ protocol: /^https?$/ }).nullable(),
    })
    .strict()
    .refine((resource) => posix.basename(resource.objectKey) === resource.sha256);

const replay_artifact_schema = z
    .object({ resources: z.array(replay_resource_schema).max(10_000) })
    .passthrough();

type ReplayResource = z.infer<typeof replay_resource_schema>;

function replay_headers(res: Response): void {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Origin-Agent-Cluster", "?1");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
}

function cookie_token(req: Request): string | null {
    const cookie = req.headers.cookie;
    if (!cookie) return null;
    const cookie_name = replay_cookie_name();
    for (const entry of cookie.split(";")) {
        const separator = entry.indexOf("=");
        if (separator < 0 || entry.slice(0, separator).trim() !== cookie_name) continue;
        try {
            return decodeURIComponent(entry.slice(separator + 1).trim());
        } catch {
            return null;
        }
    }
    return null;
}

function replay_cookie_name(): string {
    return ENV.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN?.startsWith("https://")
        ? REPLAY_CAPABILITY_COOKIE
        : LOCAL_REPLAY_CAPABILITY_COOKIE;
}

function route_path(req: Request): string {
    const value = req.params.replay_path;
    const segments = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    return `/${segments.join("/")}`;
}

function request_query(req: Request): string {
    const request_url = new URL(req.originalUrl, "http://replay.internal");
    request_url.searchParams.delete("capability");
    request_url.searchParams.sort();
    const query = request_url.searchParams.toString();
    return query ? `?${query}` : "";
}

function resource_path(resource: ReplayResource): string {
    const url = new URL(resource.request.url);
    url.searchParams.sort();
    return `${url.pathname}${url.search}`;
}

function request_header(req: Request, name: string): string | undefined {
    const value = req.get(name);
    return typeof value === "string" ? value : undefined;
}

function matching_resource(
    req: Request,
    resources: ReplayResource[],
    original_path: string,
): ReplayResource | null {
    const virtualizedUrl = replay_original_url(original_path);
    const document = resources.find(
        (resource) =>
            resource.request.method === "GET" && resource.request.resourceType === "document",
    );
    const documentOrigin = document ? new URL(document.request.url).origin : null;
    return (
        resources.find(
            (resource) =>
                resource.request.method === req.method &&
                (virtualizedUrl
                    ? resource.request.url === virtualizedUrl
                    : documentOrigin !== null &&
                      new URL(resource.request.url).origin === documentOrigin &&
                      resource_path(resource) === original_path) &&
                Object.entries(resource.request.variantHeaders).every(
                    ([name, value]) => request_header(req, name) === value,
                ),
        ) ?? null
    );
}

function document_path(resources: ReplayResource[]): string | null {
    const document = resources.find(
        (resource) =>
            resource.request.method === "GET" && resource.request.resourceType === "document",
    );
    return document ? resource_path(document) : null;
}

function set_replay_cookie(res: Response, token: string, claims: ReplayCapability): void {
    const maximum_age = Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
    const secure =
        ReplayAccess.artifact_origin(claims.productDiffId, claims.artifactId).protocol === "https:";
    const policy = secure ? "; SameSite=None; Secure; Partitioned" : "; SameSite=Lax";
    res.setHeader(
        "Set-Cookie",
        `${replay_cookie_name()}=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=${maximum_age}${policy}`,
    );
}

function content_request_allowed(req: Request): boolean {
    const destination = req.get("sec-fetch-dest");
    return typeof destination === "string" && destination !== "document";
}

function content_launch_url(claims: ReplayCapability, documentPath: string, token: string): string {
    const url = new URL(
        documentPath,
        ReplayAccess.artifact_content_origin(claims.productDiffId, claims.artifactId),
    );
    url.searchParams.set("capability", token);
    return url.toString();
}

async function authorized_artifact(claims: ReplayCapability) {
    const product_diff = await prisma.productDiff.findFirst({
        where: { id: claims.productDiffId, issue: { projectId: claims.projectId } },
        select: { status: true, manifest: true, artifactPrefix: true },
    });
    const manifest = product_diff?.manifest as ProductDiffManifest | null;
    if (
        !product_diff ||
        product_diff.status !== "Ready" ||
        !product_diff.artifactPrefix ||
        !is_replay_product_diff_manifest(manifest) ||
        !replayArtifactKeys(manifest).has(claims.artifactId)
    ) {
        return null;
    }

    const manifest_key = `${product_diff.artifactPrefix}/${claims.artifactId}`;
    const body = await StorageService.read_product_diff_object(
        manifest_key,
        MAX_REPLAY_MANIFEST_BYTES,
    );
    const artifact = replay_artifact_schema.parse(JSON.parse(body.toString("utf8")));
    return {
        artifactPrefix: product_diff.artifactPrefix,
        artifactDirectory: posix.dirname(claims.artifactId),
        resources: artifact.resources,
    };
}

export default async function serve_replay_artifact_controller(req: Request, res: Response) {
    replay_headers(res);
    if (!ReplayAccess.is_configured()) {
        ResponseWriter.not_found(res);
        return;
    }

    const query_token = typeof req.query.capability === "string" ? req.query.capability : null;
    const token = query_token ?? cookie_token(req);
    if (!token) {
        ResponseWriter.not_authorized(res, "Missing replay capability");
        return;
    }

    let claims: ReplayCapability;
    try {
        claims = await ReplayAccess.verify(token);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            ResponseWriter.not_authorized(res, "Expired replay capability");
            return;
        }
        ResponseWriter.not_authorized(res, "Invalid replay capability");
        return;
    }

    try {
        const shell_request = ReplayAccess.host_matches(
            req.get("host"),
            claims.productDiffId,
            claims.artifactId,
        );
        const content_request = ReplayAccess.content_host_matches(
            req.get("host"),
            claims.productDiffId,
            claims.artifactId,
        );
        if (!shell_request && !content_request) {
            ResponseWriter.not_authorized(res, "Replay capability is scoped to another origin");
            return;
        }
        const shell_origin = ReplayAccess.artifact_origin(
            claims.productDiffId,
            claims.artifactId,
        ).origin;
        const content_origin = ReplayAccess.artifact_content_origin(
            claims.productDiffId,
            claims.artifactId,
        ).origin;
        res.setHeader(
            "Content-Security-Policy",
            content_request
                ? replay_content_security_policy(
                      `${shell_origin} ${new URL(ENV.SERVER_WEB_URL).origin}`,
                  )
                : replay_shell_content_security_policy(
                      new URL(ENV.SERVER_WEB_URL).origin,
                      content_origin,
                  ),
        );
        if (content_request && !content_request_allowed(req)) {
            ResponseWriter.not_authorized(res, "Replay content requires its artifact shell");
            return;
        }

        const artifact = await authorized_artifact(claims);
        if (!artifact) {
            ResponseWriter.not_found(res, "Product Diff replay artifact not found");
            return;
        }

        if (query_token) {
            const target = document_path(artifact.resources);
            if (!target) {
                ResponseWriter.not_found(res, "Product Diff replay document not found");
                return;
            }
            set_replay_cookie(res, token, claims);
            res.setHeader("Cache-Control", "no-store");
            res.redirect(302, target);
            return;
        }

        const original_path = `${route_path(req)}${request_query(req)}`;
        const resource = matching_resource(req, artifact.resources, original_path);
        if (!resource) {
            ResponseWriter.not_found(res, "Product Diff replay path not found");
            return;
        }

        if (shell_request) {
            if (resource.request.resourceType !== "document") {
                ResponseWriter.not_found(res, "Product Diff replay path not found");
                return;
            }
            const shell = replay_delivery_shell(content_launch_url(claims, original_path, token));
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Content-Length", shell.byteLength.toString());
            res.end(shell);
            return;
        }
        const object_key = `${artifact.artifactPrefix}/${artifact.artifactDirectory}/${resource.objectKey}`;
        res.status(resource.responseStatus);
        if (resource.redirectLocation) {
            res.setHeader("Location", replay_delivery_path(resource.redirectLocation));
        }
        if (req.method === "HEAD" || [204, 205, 304].includes(resource.responseStatus)) {
            const object = await StorageService.stream_product_diff_object(object_key);
            res.setHeader("Content-Type", object.contentType);
            res.setHeader("Content-Length", object.size.toString());
            object.body.destroy();
            res.end();
            return;
        }
        const responseContentType =
            resource.request.responseContentType ?? "application/octet-stream";
        if (!replay_body_requires_rewrite(responseContentType)) {
            const object = await StorageService.stream_product_diff_object(object_key);
            res.setHeader("Content-Type", object.contentType);
            res.setHeader("Content-Length", object.size.toString());
            await pipeline(object.body, res);
            return;
        }
        const storedBody = await StorageService.read_product_diff_object(
            object_key,
            MAX_REPLAY_RESOURCE_BYTES,
        );
        const body = rewrite_replay_delivery_body(
            storedBody,
            responseContentType,
            artifact.resources.map((candidate) => candidate.request.url),
        );
        res.setHeader("Content-Type", responseContentType);
        res.setHeader("Content-Length", body.byteLength.toString());
        res.end(body);
    } catch (error) {
        console.error("error in serve_replay_artifact_controller:", error);
        if (!res.headersSent) ResponseWriter.system_error(res);
        else res.destroy();
    }
}
