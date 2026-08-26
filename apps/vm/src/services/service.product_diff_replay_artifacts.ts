import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { mkdir, mkdtemp, open, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import { gunzipSync } from "node:zlib";

import type Logger from "@trymatcha/logger";
import {
    type ProductDiffFramework,
    type ProductDiffManifestV4,
    replayArtifactKeys,
    type ReplayRevisionArtifact,
    type ReplayRevisionEvidence,
} from "@trymatcha/types";
import type { Sandbox } from "e2b";
import { Client as MinioClient } from "minio";
import { z } from "zod";

import { ENV } from "../conf/config.env";
import type { PreviewReplayCapture } from "./service.preview_replay";
import type { ReplayReviewPlan } from "./service.preview_runner";
import { build_replay_archive_command } from "./service.product_diff_replay_archive";

const ARCHIVE_PATH = "/home/user/output/replay.tar.gz";
const ARCHIVE_TIMEOUT_MS = 5 * 60_000;
const MAX_COMPRESSED_ARCHIVE_BYTES = 100_000_000;
const MAX_EXPANDED_ARCHIVE_BYTES = 500_000_000;
const MAX_ARCHIVE_ENTRY_BYTES = 50_000_000;
const MAX_ARCHIVE_ENTRIES = 50_000;
const TAR_BLOCK_BYTES = 512;
const UPLOAD_CONCURRENCY = 8;
const HASHED_RESOURCE_PATH = /\/(assets|responses)\/[a-f0-9]{64}$/;
const SAFE_CONTENT_TYPE =
    /^(application\/(javascript|json|manifest\+json|octet-stream|wasm)|font\/(otf|ttf|woff|woff2)|image\/(avif|gif|jpeg|png|svg\+xml|webp|x-icon)|text\/(css|html|plain))$/;

const replayArtifactSchema = z.object({
    resources: z
        .array(
            z.object({
                request: z.object({ responseContentType: z.string().max(200).nullable() }),
                objectKey: z.string().regex(/^(assets|responses)\/[a-f0-9]{64}$/),
            }),
        )
        .max(10_000),
});

interface ReplayArchiveFile {
    key: string;
    path: string;
    contentType: string;
}

interface ReplayTarEntry {
    key: string;
    kind: "file" | "directory";
    size: number;
    dataOffset: number;
}

interface ReplayExtractedFile {
    key: string;
    path: string;
}

function minio_storage() {
    if (
        !ENV.SERVER_MINIO_URL ||
        !ENV.SERVER_MINIO_ACCESS_KEY ||
        !ENV.SERVER_MINIO_SECRET_KEY ||
        !ENV.SERVER_PRODUCT_DIFF_BUCKET
    ) {
        throw new Error("MinIO Product Diff storage is not configured");
    }
    const endpoint = new URL(ENV.SERVER_MINIO_URL);
    const bucket = ENV.SERVER_PRODUCT_DIFF_BUCKET;
    const client = new MinioClient({
        endPoint: endpoint.hostname,
        port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
        useSSL: endpoint.protocol === "https:",
        accessKey: ENV.SERVER_MINIO_ACCESS_KEY,
        secretKey: ENV.SERVER_MINIO_SECRET_KEY,
    });

    return {
        async put(key: string, body: Uint8Array, contentType: string) {
            const contents = Buffer.from(body);
            await client.putObject(bucket, key, contents, contents.length, {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
            });
        },
        async remove_prefix(prefix: string) {
            const keys: string[] = [];
            for await (const object of client.listObjectsV2(bucket, `${prefix}/`, true)) {
                if (object.name) keys.push(object.name);
            }
            if (keys.length) await client.removeObjects(bucket, keys);
        },
    };
}

export type ReplayArtifactStorage = ReturnType<typeof minio_storage>;

function archive_entry_is_safe(entry: string): boolean {
    const normalized = posix.normalize(entry.replace(/^\.\//, ""));
    const containsControlCharacter = [...normalized].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127;
    });
    return (
        normalized === "." ||
        (!posix.isAbsolute(normalized) &&
            normalized !== ".." &&
            !normalized.startsWith("../") &&
            !normalized.includes("\\") &&
            !containsControlCharacter)
    );
}

function tar_string(header: Buffer, offset: number, length: number): string {
    const field = header.subarray(offset, offset + length);
    const terminator = field.indexOf(0);
    return field.subarray(0, terminator < 0 ? field.length : terminator).toString("utf8");
}

function tar_octal(header: Buffer, offset: number, length: number): number {
    const value = tar_string(header, offset, length).trim();
    if (!/^[0-7]+$/.test(value)) throw new Error("Replay archive has an invalid tar header");
    const parsed = Number.parseInt(value, 8);
    if (!Number.isSafeInteger(parsed)) throw new Error("Replay archive has an invalid tar size");
    return parsed;
}

function tar_checksum(header: Buffer): number {
    let checksum = 0;
    for (let index = 0; index < header.length; index += 1) {
        checksum += index >= 148 && index < 156 ? 32 : (header[index] ?? 0);
    }
    return checksum;
}

function replay_tar_entries(archive: Uint8Array): { body: Buffer; entries: ReplayTarEntry[] } {
    if (archive.byteLength > MAX_COMPRESSED_ARCHIVE_BYTES) {
        throw new Error("Replay archive exceeds the compressed size limit");
    }
    let body: Buffer;
    try {
        body = gunzipSync(archive, { maxOutputLength: MAX_EXPANDED_ARCHIVE_BYTES });
    } catch {
        throw new Error("Replay archive could not be expanded within its size limit");
    }
    if (body.byteLength > MAX_EXPANDED_ARCHIVE_BYTES) {
        throw new Error("Replay archive exceeds the expanded size limit");
    }

    const entries: ReplayTarEntry[] = [];
    const paths = new Map<string, "file" | "directory">();
    let offset = 0;
    let reachedEnd = false;
    while (offset + TAR_BLOCK_BYTES <= body.length) {
        const header = body.subarray(offset, offset + TAR_BLOCK_BYTES);
        if (header.every((byte) => byte === 0)) {
            reachedEnd = true;
            break;
        }
        if (entries.length >= MAX_ARCHIVE_ENTRIES) {
            throw new Error("Replay archive exceeds the entry count limit");
        }
        if (tar_octal(header, 148, 8) !== tar_checksum(header)) {
            throw new Error("Replay archive has an invalid tar checksum");
        }
        if (tar_string(header, 257, 6) !== "ustar") {
            throw new Error("Replay archive has an invalid tar format");
        }
        const name = tar_string(header, 0, 100);
        const prefix = tar_string(header, 345, 155);
        const rawKey = prefix ? `${prefix}/${name}` : name;
        if (!archive_entry_is_safe(rawKey)) {
            throw new Error("Replay archive contains an unsafe path");
        }
        const key = posix.normalize(rawKey.replace(/^\.\//, ""));
        const size = tar_octal(header, 124, 12);
        if (size > MAX_ARCHIVE_ENTRY_BYTES) {
            throw new Error("Replay archive entry exceeds the size limit");
        }
        const linkTarget = tar_string(header, 157, 100);
        if (linkTarget && !archive_entry_is_safe(linkTarget)) {
            throw new Error("Replay archive contains an unsafe link target");
        }
        const type = header[156] ?? 0;
        const kind = type === 0 || type === 48 ? "file" : type === 53 ? "directory" : null;
        if (!kind)
            throw new Error("Replay archive contains an unsupported replay archive entry type");
        if (kind === "file" && key === ".") {
            throw new Error("Replay archive contains an invalid file path");
        }
        if (kind === "directory" && size !== 0) {
            throw new Error("Replay archive directory has a non-zero size");
        }
        if (paths.has(key)) throw new Error("Replay archive contains a duplicate path");
        paths.set(key, kind);

        const dataOffset = offset + TAR_BLOCK_BYTES;
        const paddedSize = Math.ceil(size / TAR_BLOCK_BYTES) * TAR_BLOCK_BYTES;
        if (dataOffset + paddedSize > body.length) {
            throw new Error("Replay archive entry is truncated");
        }
        entries.push({ key, kind, size, dataOffset });
        offset = dataOffset + paddedSize;
    }
    if (!reachedEnd || body.subarray(offset).some((byte) => byte !== 0)) {
        throw new Error("Replay archive has an invalid end marker");
    }
    for (const entry of entries) {
        let parent = posix.dirname(entry.key);
        while (parent !== ".") {
            if (paths.get(parent) === "file") {
                throw new Error("Replay archive file is used as a directory");
            }
            parent = posix.dirname(parent);
        }
    }
    return { body, entries };
}

async function unpack_archive(
    archive: Uint8Array,
    workDir: string,
): Promise<ReplayExtractedFile[]> {
    const validated = replay_tar_entries(archive);
    const replayRoot = join(workDir, "replay");
    await mkdir(replayRoot, { mode: 0o700 });
    for (const entry of validated.entries.filter((candidate) => candidate.kind === "directory")) {
        if (entry.key !== ".") {
            await mkdir(join(replayRoot, ...entry.key.split("/")), {
                recursive: true,
                mode: 0o700,
            });
        }
    }

    const files: ReplayExtractedFile[] = [];
    for (const entry of validated.entries.filter((candidate) => candidate.kind === "file")) {
        const path = join(replayRoot, ...entry.key.split("/"));
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const handle = await open(
            path,
            fsConstants.O_CREAT |
                fsConstants.O_EXCL |
                fsConstants.O_WRONLY |
                fsConstants.O_NOFOLLOW,
            0o600,
        );
        try {
            await handle.writeFile(
                validated.body.subarray(entry.dataOffset, entry.dataOffset + entry.size),
            );
        } finally {
            await handle.close();
        }
        files.push({ key: entry.key, path });
    }
    return files;
}

function safe_content_type(value: string | null): string {
    const normalized = value?.toLowerCase().split(";", 1)[0]?.trim() ?? "";
    return SAFE_CONTENT_TYPE.test(normalized) ? normalized : "application/octet-stream";
}

async function read_sandbox_archive(sandbox: Sandbox): Promise<Uint8Array> {
    const info = await sandbox.files.getInfo(ARCHIVE_PATH);
    if (
        info.type !== "file" ||
        !Number.isSafeInteger(info.size) ||
        info.size < 0 ||
        info.size > MAX_COMPRESSED_ARCHIVE_BYTES
    ) {
        throw new Error("Replay archive exceeds the compressed size limit");
    }

    const stream = await sandbox.files.read(ARCHIVE_PATH, { format: "stream" });
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let transferredBytes = 0;
    try {
        let next = await reader.read();
        while (!next.done) {
            transferredBytes += next.value.byteLength;
            if (transferredBytes > MAX_COMPRESSED_ARCHIVE_BYTES) {
                await reader.cancel();
                throw new Error("Replay archive exceeds the compressed size limit");
            }
            chunks.push(next.value);
            next = await reader.read();
        }
    } finally {
        reader.releaseLock();
    }
    if (transferredBytes !== info.size) {
        throw new Error("Replay archive size changed during transfer");
    }
    return Buffer.concat(
        chunks.map((chunk) => Buffer.from(chunk)),
        transferredBytes,
    );
}

function artifact_archive_key(artifactKey: string): string {
    if (
        !artifactKey.startsWith("replay/") ||
        artifactKey !== posix.normalize(artifactKey) ||
        !archive_entry_is_safe(artifactKey) ||
        !artifactKey.endsWith("/artifact.json")
    ) {
        throw new Error("V4 manifest contains an invalid replay artifact key");
    }
    return artifactKey.slice("replay/".length);
}

async function archive_files(
    allFiles: ReplayExtractedFile[],
    manifest: ProductDiffManifestV4,
): Promise<ReplayArchiveFile[]> {
    const filesByKey = new Map(allFiles.map((file) => [file.key, file]));
    const artifactKeys = [...replayArtifactKeys(manifest)].map(artifact_archive_key);
    const contentTypes = new Map<string, string>();
    const ownedKeys = new Set(artifactKeys);
    for (const artifactKey of artifactKeys) {
        const file = filesByKey.get(artifactKey);
        if (!file) throw new Error("V4 referenced replay artifact is missing");
        const body = await readFile(file.path);
        if (body.length > 5_000_000) throw new Error("Replay artifact manifest is too large");
        const artifact = replayArtifactSchema.parse(JSON.parse(body.toString("utf8")));
        const directory = posix.dirname(artifactKey);
        for (const resource of artifact.resources) {
            const key = posix.join(directory, resource.objectKey);
            if (ownedKeys.has(key)) throw new Error("Replay artifact declares a duplicate object");
            ownedKeys.add(key);
            contentTypes.set(key, safe_content_type(resource.request.responseContentType));
        }
    }
    if ([...ownedKeys].some((key) => !filesByKey.has(key))) {
        throw new Error("Replay artifact manifest references a missing object");
    }
    if (allFiles.some((file) => !ownedKeys.has(file.key))) {
        throw new Error("Replay archive contains an unowned replay archive file");
    }
    for (const key of contentTypes.keys()) {
        const file = filesByKey.get(key);
        if (!file) throw new Error("Replay artifact manifest references a missing object");
        const body = await readFile(file.path);
        const expectedHash = posix.basename(key);
        const actualHash = createHash("sha256").update(body).digest("hex");
        if (actualHash !== expectedHash) {
            throw new Error("Replay object bytes do not match their content address");
        }
    }

    return allFiles
        .map((file) => {
            const key = file.key;
            if (key.endsWith("/artifact.json"))
                return {
                    key: posix.join("replay", key),
                    path: file.path,
                    contentType: "application/json",
                };
            if (!HASHED_RESOURCE_PATH.test(`/${key}`)) {
                throw new Error("Replay archive contains an unexpected file");
            }
            const contentType = contentTypes.get(key);
            if (!contentType) {
                throw new Error("Replay content-addressed object is not declared by its manifest");
            }
            return {
                key: posix.join("replay", key),
                path: file.path,
                contentType,
            };
        })
        .sort((left, right) => {
            const leftManifest = left.key.endsWith("/artifact.json");
            const rightManifest = right.key.endsWith("/artifact.json");
            if (leftManifest !== rightManifest) return leftManifest ? 1 : -1;
            return left.key.localeCompare(right.key);
        });
}

function unavailable_artifact(): ReplayRevisionArtifact {
    return {
        artifactKey: null,
        fidelity: "Unavailable",
        diagnostics: ["replay capture was unavailable"],
        evidence: {
            scenarios: [],
            dom: null,
            accessibility: null,
            consoleDiagnostics: [],
            failedRequestDiagnostics: [],
        },
    };
}

function persisted_replay_evidence(
    evidence: ReplayRevisionEvidence | undefined,
): ReplayRevisionEvidence {
    if (!evidence) {
        return {
            scenarios: [],
            dom: null,
            accessibility: null,
            consoleDiagnostics: [],
            failedRequestDiagnostics: [],
        };
    }
    const consoleErrorCount = Math.min(evidence.consoleDiagnostics.length, 20);
    const failedRequestCount = Math.min(evidence.failedRequestDiagnostics.length, 20);
    return {
        scenarios: evidence.scenarios.slice(0, 12).map((scenario) => ({
            ...scenario,
            actions: scenario.actions.slice(0, 12).map((action) => ({
                ...action,
                ...(action.diagnostic ? { diagnostic: "Replay action failed" } : {}),
            })),
        })),
        dom: evidence.dom,
        accessibility: evidence.accessibility,
        consoleDiagnostics:
            consoleErrorCount === 0
                ? []
                : [
                      `${consoleErrorCount} console ${consoleErrorCount === 1 ? "error" : "errors"}; details redacted`,
                  ],
        failedRequestDiagnostics:
            failedRequestCount === 0
                ? []
                : [
                      `${failedRequestCount} replay ${failedRequestCount === 1 ? "request" : "requests"} failed; details redacted`,
                  ],
    };
}

function artifact_for(
    captures: PreviewReplayCapture[],
    revision: "head" | "base",
    applicationId: string,
    surfaceId: string,
    stateId: string,
    viewportId: string,
): ReplayRevisionArtifact {
    const capture = captures.find(
        (candidate) =>
            candidate.revision === revision &&
            candidate.applicationId === applicationId &&
            candidate.surfaceId === surfaceId &&
            candidate.stateId === stateId &&
            candidate.viewportId === viewportId,
    );
    if (!capture) return unavailable_artifact();
    return {
        artifactKey: capture.fidelity === "Unavailable" ? null : capture.artifactKey,
        fidelity: capture.fidelity,
        diagnostics: capture.diagnostics,
        evidence: persisted_replay_evidence(capture.evidence),
    };
}

export default class ProductDiffReplayArtifacts {
    static build_manifest(input: {
        plan: ReplayReviewPlan;
        framework: ProductDiffFramework;
        captures: PreviewReplayCapture[];
        warnings: string[];
    }): ProductDiffManifestV4 {
        return {
            version: 4,
            framework: input.framework,
            applications: input.plan.applications,
            surfaces: input.plan.surfaces.map((surface) => ({
                id: surface.id,
                applicationId: surface.applicationId,
                label: surface.label,
                states: surface.states.map((state) => ({
                    id: state.id,
                    label: state.label,
                    viewports: surface.viewports.map((viewport) => ({
                        ...viewport,
                        base: artifact_for(
                            input.captures,
                            "base",
                            surface.applicationId,
                            surface.id,
                            state.id,
                            viewport.id,
                        ),
                        head: artifact_for(
                            input.captures,
                            "head",
                            surface.applicationId,
                            surface.id,
                            state.id,
                            viewport.id,
                        ),
                    })),
                })),
            })),
            warnings: input.warnings,
        };
    }

    static has_valid_result(manifest: ProductDiffManifestV4): boolean {
        return manifest.surfaces.some((surface) =>
            surface.states.some((state) =>
                state.viewports.some((viewport) =>
                    [viewport.base, viewport.head].some(
                        (artifact) =>
                            artifact.artifactKey !== null && artifact.fidelity !== "Unavailable",
                    ),
                ),
            ),
        );
    }

    static async upload(
        sandbox: Sandbox,
        replayDir: string,
        prefix: string,
        manifest: ProductDiffManifestV4,
        log: Logger,
        storage: ReplayArtifactStorage = minio_storage(),
    ): Promise<number> {
        const archived = await sandbox.commands.run(
            build_replay_archive_command(replayDir, ARCHIVE_PATH, manifest),
            { timeoutMs: ARCHIVE_TIMEOUT_MS },
        );
        if (archived.exitCode !== 0) throw new Error("Replay archive could not be created");
        const archive = await read_sandbox_archive(sandbox);
        const workDir = await mkdtemp(join(tmpdir(), "matcha-replay-"));
        try {
            const extractedFiles = await unpack_archive(archive, workDir);
            const files = await archive_files(extractedFiles, manifest);
            try {
                for (let index = 0; index < files.length; index += UPLOAD_CONCURRENCY) {
                    const batch = files.slice(index, index + UPLOAD_CONCURRENCY);
                    const uploads = await Promise.allSettled(
                        batch.map(async (file) => {
                            const body = await readFile(file.path);
                            await storage.put(`${prefix}/${file.key}`, body, file.contentType);
                        }),
                    );
                    const failed = uploads.find(
                        (upload): upload is PromiseRejectedResult => upload.status === "rejected",
                    );
                    if (failed) throw failed.reason;
                }
                const manifestBody = Buffer.from(JSON.stringify(manifest));
                await storage.put(`${prefix}/manifest.json`, manifestBody, "application/json");
                log.info("uploaded Product Diff replay artifacts", { count: files.length + 1 });
                return files.length + 1;
            } catch (error) {
                await storage.remove_prefix(prefix).catch(() => undefined);
                throw error;
            }
        } finally {
            await rm(workDir, { recursive: true, force: true });
        }
    }
}
