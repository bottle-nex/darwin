import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix, relative, sep } from "node:path";
import { promisify } from "node:util";

import type Logger from "@trymatcha/logger";
import type {
    ProductDiffDiagnostic,
    ProductDiffFramework,
    ProductDiffManifestV3,
    ProductDiffShotOutcome,
    ProductDiffViewport,
    ProductReviewShot,
    ProductReviewTarget,
} from "@trymatcha/types";
import type { Sandbox } from "e2b";
import { Client as MinioClient } from "minio";

import { ENV } from "../conf/config.env";
import type { HarnessManifest, PreviewPair } from "./service.preview_runner";

const run_command = promisify(execFile);
const ARCHIVE_PATH = "/home/user/output/shots.tar.gz";
const UPLOAD_CONCURRENCY = 8;
const ARCHIVE_TIMEOUT_MS = 5 * 60_000;
const OBJECT_METADATA = {
    "Content-Type": "image/png",
    "Cache-Control": "private, max-age=31536000, immutable",
};

function minio_storage(): { client: MinioClient; bucket: string } {
    if (
        !ENV.SERVER_MINIO_URL ||
        !ENV.SERVER_MINIO_ACCESS_KEY ||
        !ENV.SERVER_MINIO_SECRET_KEY ||
        !ENV.SERVER_PRODUCT_DIFF_BUCKET
    ) {
        throw new Error("MinIO Product Diff storage is not configured");
    }

    const endpoint = new URL(ENV.SERVER_MINIO_URL);
    return {
        client: new MinioClient({
            endPoint: endpoint.hostname,
            port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
            useSSL: endpoint.protocol === "https:",
            accessKey: ENV.SERVER_MINIO_ACCESS_KEY,
            secretKey: ENV.SERVER_MINIO_SECRET_KEY,
        }),
        bucket: ENV.SERVER_PRODUCT_DIFF_BUCKET,
    };
}

async function png_files(root: string): Promise<string[]> {
    const found: string[] = [];

    const walk = async (directory: string): Promise<void> => {
        for (const entry of await readdir(directory)) {
            const absolute = join(directory, entry);
            if ((await stat(absolute)).isDirectory()) {
                await walk(absolute);
            } else if (entry.endsWith(".png") && !entry.endsWith(".padded.png")) {
                found.push(relative(root, absolute).split(sep).join(posix.sep));
            }
        }
    };

    await walk(root);
    return found;
}

function rollup(shots: ProductReviewShot[]): ProductDiffShotOutcome {
    if (shots.some((shot) => shot.outcome === "Rendered")) return "Rendered";
    if (shots.length && shots.every((shot) => shot.outcome === "Added")) return "Added";
    if (shots.length && shots.every((shot) => shot.outcome === "Removed")) return "Removed";
    return "Unavailable";
}

export default class ProductDiffArtifacts {
    /**
     * Copies every screenshot out of the sandbox and into object storage.
     *
     * The pictures are bundled into a single archive first. Pulling them out one file at a time
     * would mean well over a hundred separate round trips to the sandbox for one preview; bundling
     * makes it one.
     *
     * @example
     * await ProductDiffArtifacts.upload(sandbox, "/home/user/output/shots", "product-diffs/p1/42/abc-def/pd1", log);
     * // uploads .../shots/header-nav/default/desktop/head.png and returns how many objects landed
     */
    static async upload(
        sandbox: Sandbox,
        shotsDir: string,
        prefix: string,
        log: Logger,
    ): Promise<number> {
        await sandbox.commands.run(`tar -czf ${ARCHIVE_PATH} -C ${shotsDir} .`, {
            timeoutMs: ARCHIVE_TIMEOUT_MS,
        });
        const archive = await sandbox.files.read(ARCHIVE_PATH, { format: "bytes" });

        const workDir = await mkdtemp(join(tmpdir(), "matcha-shots-"));
        try {
            const archivePath = join(workDir, "shots.tar.gz");
            await writeFile(archivePath, archive);
            await run_command("tar", ["-xzf", archivePath, "-C", workDir]);

            const files = await png_files(workDir);
            const { client, bucket } = minio_storage();

            for (let index = 0; index < files.length; index += UPLOAD_CONCURRENCY) {
                const batch = files.slice(index, index + UPLOAD_CONCURRENCY);
                await Promise.all(
                    batch.map(async (file) => {
                        const body = await readFile(join(workDir, file));
                        await client.putObject(
                            bucket,
                            `${prefix}/shots/${file}`,
                            body,
                            body.length,
                            OBJECT_METADATA,
                        );
                    }),
                );
            }

            log.info("uploaded Product Diff screenshots", { count: files.length });
            return files.length;
        } finally {
            await rm(workDir, { recursive: true, force: true });
        }
    }

    /**
     * Turns the harness list and the screenshot results into the manifest the web pane reads.
     *
     * Keys are stored relative to the row's prefix rather than as full paths, because the prefix
     * already lives on the row and holding the same string in two places is how they drift apart.
     *
     * @example
     * ProductDiffArtifacts.build_manifest({ harness, pair, framework: "NextAppRouter", viewports, warnings: [] });
     * // { version: 3, targets: [{ id: "header-nav", shots: [{ headKey: "shots/header-nav/default/desktop/head.png", ... }] }] }
     */
    static build_manifest(input: {
        harness: HarnessManifest;
        pair: PreviewPair;
        framework: ProductDiffFramework;
        viewports: ProductDiffViewport[];
        warnings: string[];
        adapter: {
            id: string;
            applicationPath: string;
            workspaceKind: string;
            router: string;
        };
        diagnostics: ProductDiffDiagnostic[];
    }): ProductDiffManifestV3 {
        const targets: ProductReviewTarget[] = input.harness.targets.map((target) => {
            const shots: ProductReviewShot[] = input.pair.shots
                .filter((shot) => shot.targetId === target.id)
                .map((shot) => ({
                    stateId: shot.stateId,
                    viewportId: shot.viewportId,
                    outcome: shot.outcome,
                    baseKey: shot.base.file ? `shots/${shot.base.file}` : null,
                    headKey: shot.head.file ? `shots/${shot.head.file}` : null,
                    error: shot.error,
                }));

            return {
                id: target.id,
                label: target.label,
                sourcePath: target.sourcePath,
                outcome: rollup(shots),
                states: target.states,
                shots,
            };
        });

        return {
            version: 3,
            framework: input.framework,
            viewports: input.viewports,
            targets,
            warnings: [
                ...input.harness.warnings,
                ...input.pair.warnings,
                ...input.warnings,
                `adapter=${input.adapter.id}; applicationPath=${input.adapter.applicationPath}; workspaceKind=${input.adapter.workspaceKind}; router=${input.adapter.router}`,
                ...input.diagnostics.map(
                    (diagnostic) =>
                        `diagnostic=${diagnostic.code}; stage=${diagnostic.stage}; message=${diagnostic.message}`,
                ),
            ],
        };
    }
}
