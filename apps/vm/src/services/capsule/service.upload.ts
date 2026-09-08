import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, posix, relative, sep } from "node:path";

import type Logger from "@trydarwin/logger";
import {
    type Capsule,
    CAPSULE_MANIFEST_VERSION,
    type CapsuleFidelity,
    type CapsuleManifest,
    type CapsuleRevision as ManifestRevision,
} from "@trydarwin/types";
import type { Sandbox } from "e2b";
import { Client as MinioClient } from "minio";

import { ENV } from "../../conf/config.env";
import type { CapsuleSpec } from "./service.author";
import type { CapsuleRevision } from "./service.harness";

const DIST_ROOT = "/home/user/dist";
const ARCHIVE_PATH = "/home/user/dist.tar.gz";
const ARCHIVE_TIMEOUT_MS = 4 * 60_000;
const UPLOAD_CONCURRENCY = 8;
const REVISIONS: CapsuleRevision[] = ["base", "head"];

export const REVISION_BYTE_CAP = 200 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".wasm": "application/wasm",
};

export interface GateResult {
    capsuleId: string;
    fidelity: CapsuleFidelity;
    diagnostics: string[];
}

export type GateResults = Record<CapsuleRevision, Record<string, GateResult>>;

export interface UploadFile {
    path: string;
    bytes: number;
}

export function artifact_content_type(path: string): string {
    return CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

export function plan_uploads(files: UploadFile[]): { upload: UploadFile[]; skipped: string[] } {
    const upload: UploadFile[] = [];
    const skipped: string[] = [];
    let total = 0;

    for (const file of files) {
        if (total + file.bytes > REVISION_BYTE_CAP) {
            skipped.push(file.path);
            continue;
        }
        total += file.bytes;
        upload.push(file);
    }
    return { upload, skipped };
}

function revision_of(spec: CapsuleSpec, revision: CapsuleRevision, gates: GateResults) {
    const gate = gates[revision][spec.id];
    if (!spec.entries[revision] || !gate) return null;

    return {
        path: `${revision}/${spec.id}/index.html`,
        fidelity: gate.fidelity,
        diagnostics: gate.diagnostics,
    } satisfies ManifestRevision;
}

export function build_manifest(
    specs: CapsuleSpec[],
    gates: GateResults,
    warnings: string[],
): CapsuleManifest {
    const capsules: Capsule[] = [];
    const collected = [...warnings];

    for (const spec of specs) {
        const base = revision_of(spec, "base", gates);
        const head = revision_of(spec, "head", gates);

        if (!base && !head) {
            collected.push(`${spec.title} could not be previewed at either revision`);
            continue;
        }

        capsules.push({
            id: spec.id,
            title: spec.title,
            componentPath: spec.componentPath,
            change: spec.change,
            viewport: spec.viewport,
            controls: spec.controls,
            base,
            head,
        });
    }

    return { version: CAPSULE_MANIFEST_VERSION, capsules, warnings: collected };
}

export default class CapsuleUpload {
    public static async publish(
        sandbox: Sandbox,
        product_diff_id: string,
        specs: CapsuleSpec[],
        gates: GateResults,
        warnings: string[],
        log: Logger,
    ): Promise<{ manifest: CapsuleManifest; prefix: string }> {
        const prefix = `product-diff/${product_diff_id}`;
        const staged = await this.download(sandbox, log);

        try {
            const files = await this.list_files(staged);
            const { upload, skipped } = plan_uploads(files);
            await this.push(staged, prefix, upload, log);

            const all_warnings = [...warnings];
            if (skipped.length > 0) {
                all_warnings.push(
                    `${skipped.length} preview files were too large to publish and were left out`,
                );
            }

            log.success("capsule bundles published", { objects: upload.length, prefix });
            return { manifest: build_manifest(specs, gates, all_warnings), prefix };
        } finally {
            await rm(staged, { recursive: true, force: true });
        }
    }

    private static async download(sandbox: Sandbox, log: Logger): Promise<string> {
        await sandbox.commands.run(
            `mkdir -p ${DIST_ROOT} && tar -czf ${ARCHIVE_PATH} -C ${DIST_ROOT} .`,
            { timeoutMs: ARCHIVE_TIMEOUT_MS },
        );

        const archive = await sandbox.files.read(ARCHIVE_PATH, { format: "bytes" });
        const staged = await mkdtemp(join(tmpdir(), "darwin-capsules-"));
        const local_archive = join(staged, "dist.tar.gz");
        await writeFile(local_archive, Buffer.from(archive));

        await Bun.$`tar -xzf ${local_archive} -C ${staged}`.quiet();
        await rm(local_archive, { force: true });

        log.info("capsule bundles pulled out of the sandbox");
        return staged;
    }

    private static async list_files(root: string): Promise<UploadFile[]> {
        const found: UploadFile[] = [];

        const walk = async (directory: string): Promise<void> => {
            for (const entry of await readdir(directory)) {
                const absolute = join(directory, entry);
                const info = await stat(absolute);
                if (info.isDirectory()) {
                    await walk(absolute);
                    continue;
                }
                found.push({
                    path: relative(root, absolute).split(sep).join(posix.sep),
                    bytes: info.size,
                });
            }
        };

        await walk(root);
        return found.filter((file) => REVISIONS.some((name) => file.path.startsWith(`${name}/`)));
    }

    private static async push(
        root: string,
        prefix: string,
        files: UploadFile[],
        log: Logger,
    ): Promise<void> {
        const { client, bucket } = this.storage();
        const queue = [...files];

        const worker = async (): Promise<void> => {
            for (let file = queue.pop(); file; file = queue.pop()) {
                const body = await readFile(join(root, file.path));
                await client.putObject(bucket, `${prefix}/${file.path}`, body, body.length, {
                    "Content-Type": artifact_content_type(file.path),
                    "Cache-Control": "private, max-age=31536000, immutable",
                });
            }
        };

        await Promise.all(
            Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker),
        );
        log.info("capsule files uploaded", { count: files.length });
    }

    private static storage(): { client: MinioClient; bucket: string } {
        if (
            !ENV.MINIO_URL ||
            !ENV.MINIO_ACCESS_KEY ||
            !ENV.MINIO_SECRET_KEY ||
            !ENV.PRODUCT_DIFF_BUCKET
        ) {
            throw new Error("MinIO Product Diff storage is not configured");
        }

        const endpoint = new URL(ENV.MINIO_URL);
        return {
            client: new MinioClient({
                endPoint: endpoint.hostname,
                port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
                useSSL: endpoint.protocol === "https:",
                accessKey: ENV.MINIO_ACCESS_KEY,
                secretKey: ENV.MINIO_SECRET_KEY,
            }),
            bucket: ENV.PRODUCT_DIFF_BUCKET,
        };
    }
}
