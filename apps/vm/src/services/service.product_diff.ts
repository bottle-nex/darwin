import { Prisma, prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type { ProductDiffManifest } from "@trymatcha/types";
import { CommandExitError, Sandbox } from "e2b";
import { Client as MinioClient } from "minio";
import { z } from "zod";
import { ENV } from "../conf/config.env";
import ClaudeRun from "./service.claude_run";
import GithubService from "./service.github";
import { redact } from "./service.sandbox_stream";

const SANDBOX_TIMEOUT_MS = 15 * 60_000;
const AGENT_TIMEOUT_MS = 12 * 60_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_ERROR_OUTPUT = 400;
const CSP =
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'; object-src 'none'";
const PROMPT_PATH = "/home/user/product_diff_prompt.txt";
// ClaudeRun always starts in this directory. Keeping the git repository here means the
// prompt's git diff works while the two checked-out revisions remain isolated worktrees.
const REPO_DIR = "/home/user/repo";
const WORKSPACE_DIR = "/home/user/workspace";
const OUTPUT_DIR = "/home/user/output";
const SAFE_REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_SHA = /^[0-9a-f]{40,64}$/;

const manifestSchema = z.object({
    targets: z
        .array(
            z.object({
                id: z.string().min(1),
                label: z.string().min(1),
                states: z
                    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
                    .min(1),
            }),
        )
        .min(1),
    warnings: z.array(z.string()),
});

const htmlContractSchema = z.object({
    targets: z.array(
        z.object({
            id: z.string().min(1),
            states: z.array(z.object({ id: z.string().min(1) })).min(1),
        }),
    ),
});

function secure_html(html: string, expectedContract: z.infer<typeof htmlContractSchema>): string {
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
        throw new Error("Product Diff HTML is too large");
    }
    if (!html.includes("message") || !html.includes("product-diff-state")) {
        throw new Error("Product Diff HTML is missing the state message listener");
    }
    const opening = '<script id="product-diff-contract" type="application/json">';
    const start = html.indexOf(opening);
    const end = start < 0 ? -1 : html.indexOf("</script>", start + opening.length);
    if (start < 0 || end < 0) {
        throw new Error("Product Diff HTML is missing its target/state contract");
    }
    const contract = htmlContractSchema.parse(JSON.parse(html.slice(start + opening.length, end)));
    if (JSON.stringify(contract) !== JSON.stringify(expectedContract)) {
        throw new Error("Product Diff HTML contract does not match manifest");
    }
    const body = html.replace(/^\s*<!doctype html>/i, "");
    return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${CSP}">${body}`;
}

function validate_product_diff_output(
    rawManifest: string,
    baseHtml: string,
    headHtml: string,
): { manifest: ProductDiffManifest; baseHtml: string; headHtml: string } {
    const manifest = manifestSchema.parse(JSON.parse(rawManifest));
    const contract = {
        targets: manifest.targets.map((target) => ({
            id: target.id,
            states: target.states.map((state) => ({ id: state.id })),
        })),
    };
    return {
        manifest,
        baseHtml: secure_html(baseHtml, contract),
        headHtml: secure_html(headHtml, contract),
    };
}

function is_current_product_diff(
    pull: { state: string; baseSha: string; headSha: string },
    baseSha: string,
    headSha: string,
): boolean {
    return pull.state === "open" && pull.baseSha === baseSha && pull.headSha === headSha;
}

function describe_product_diff_failure(stage: string, error: unknown): string {
    const fallback = error instanceof Error ? error.message : String(error);
    if (!(error instanceof CommandExitError)) return `${stage} failed: ${fallback}`;

    const output = error.stderr.trim() || error.stdout.trim() || error.error?.trim() || fallback;
    return `${stage} failed (exit ${error.exitCode}): ${output.slice(-MAX_ERROR_OUTPUT)}`;
}

function require_minio_storage() {
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

async function upload_product_diff_artifacts(prefix: string, baseHtml: string, headHtml: string) {
    const metadata = {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=31536000, immutable",
    };
    const { client, bucket } = require_minio_storage();
    const base = Buffer.from(baseHtml);
    const head = Buffer.from(headHtml);
    await Promise.all([
        client.putObject(bucket, `${prefix}/base.html`, base, base.length, metadata),
        client.putObject(bucket, `${prefix}/head.html`, head, head.length, metadata),
    ]);
}

function prompt(baseSha: string, headSha: string): string {
    return `Read ${WORKSPACE_DIR}/base and ${WORKSPACE_DIR}/head and inspect git diff ${baseSha}..${headSha}.
Select only changed renderable components or pages. Generate both sides yourself using matching deterministic dummy data.
Write only ${OUTPUT_DIR}/manifest.json, ${OUTPUT_DIR}/base.html, and ${OUTPUT_DIR}/head.html.
Manifest must contain warnings and one or more targets with IDs, labels, and states.
Both HTML files must implement the same target/state IDs and listen for window message events shaped as { type: "product-diff-state", targetId, stateId }.
Both HTML files must include this exact element before executable scripts: <script id="product-diff-contract" type="application/json">{"targets":[{"id":"...","states":[{"id":"..."}]}]}</script>. Its IDs and order must exactly match the manifest.
If a target is absent from one revision, render an explicit absent-state placeholder there.
Preserve visible structure, classes, CSS, local assets, icons, and text hierarchy where practical. Replace providers, server data, actions, cookies, headers, middleware, and backend calls with local deterministic values.
Do not install dependencies, run package scripts, edit repository files, commit, push, call production services, or use remote assets. Keep every HTML file self-contained.`;
}

export default class ProductDiffRunner {
    static async run(productDiffId: string): Promise<void> {
        const claim = await prisma.productDiff.updateMany({
            where: { id: productDiffId, status: "Pending" },
            data: { status: "Generating", error: null },
        });
        if (claim.count === 0) return;

        const log = Logger.scope(`product-diff:${productDiffId.slice(-8)}`);
        let sandbox: Sandbox | null = null;
        let githubToken = "";
        let stage = "load Product Diff";

        try {
            const productDiff = await prisma.productDiff.findUniqueOrThrow({
                where: { id: productDiffId },
                include: {
                    issue: {
                        include: {
                            project: { include: { githubInstallation: true } },
                        },
                    },
                },
            });
            const project = productDiff.issue.project;
            stage = "validate Product Diff metadata";
            if (
                !project.githubRepoFullName ||
                !project.githubRepoId ||
                !project.githubInstallation ||
                !SAFE_REPOSITORY.test(project.githubRepoFullName) ||
                !SAFE_SHA.test(productDiff.baseSha) ||
                !SAFE_SHA.test(productDiff.headSha)
            ) {
                throw new Error("Product Diff repository metadata is invalid");
            }

            const installationId = Number(project.githubInstallation.installationId);
            stage = "create GitHub installation token";
            githubToken = await GithubService.getInstallationToken(
                installationId,
                Number(project.githubRepoId),
            );
            stage = "create preview sandbox";
            sandbox = await Sandbox.create("node-py-claude-template", {
                apiKey: ENV.SERVER_E2B_API_KEY,
                timeoutMs: SANDBOX_TIMEOUT_MS,
            });

            const remote = `https://x-access-token:${githubToken}@github.com/${project.githubRepoFullName}.git`;
            stage = "initialize repository";
            await sandbox.commands.run(
                `mkdir -p ${WORKSPACE_DIR} ${OUTPUT_DIR} && git init ${REPO_DIR}`,
            );
            stage = "configure GitHub remote";
            await sandbox.commands.run(`git remote add origin ${remote}`, { cwd: REPO_DIR });
            stage = "fetch base revision";
            await sandbox.commands.run(`git fetch --depth=1 origin ${productDiff.baseSha}`, {
                cwd: REPO_DIR,
            });
            stage = "verify base revision";
            const fetchedBase = await sandbox.commands.run("git rev-parse FETCH_HEAD", {
                cwd: REPO_DIR,
            });
            if (fetchedBase.stdout.trim() !== productDiff.baseSha) {
                throw new Error("Fetched base SHA does not match Product Diff");
            }
            stage = "create base worktree";
            await sandbox.commands.run(
                `git worktree add --detach ${WORKSPACE_DIR}/base ${productDiff.baseSha}`,
                {
                    cwd: REPO_DIR,
                },
            );
            stage = "fetch PR head";
            await sandbox.commands.run(
                `git fetch --depth=1 origin refs/pull/${productDiff.pullNumber}/head`,
                { cwd: REPO_DIR },
            );
            stage = "verify PR head";
            const fetchedHead = await sandbox.commands.run("git rev-parse FETCH_HEAD", {
                cwd: REPO_DIR,
            });
            if (fetchedHead.stdout.trim() !== productDiff.headSha) {
                throw new Error("Fetched head SHA does not match Product Diff");
            }
            stage = "create PR head worktree";
            await sandbox.commands.run(
                `git worktree add --detach ${WORKSPACE_DIR}/head ${productDiff.headSha}`,
                {
                    cwd: REPO_DIR,
                },
            );
            stage = "remove authenticated GitHub remote";
            await sandbox.commands.run("git remote remove origin", { cwd: REPO_DIR });

            stage = "write preview-agent prompt";
            await sandbox.files.write(
                PROMPT_PATH,
                prompt(productDiff.baseSha, productDiff.headSha),
            );
            stage = "run preview agent";
            await ClaudeRun.execute(sandbox, log, {
                prompt_path: PROMPT_PATH,
                model: ENV.SERVER_SOLVE_MODEL,
                effort: ENV.SERVER_SOLVE_EFFORT,
                envs: { CLAUDE_CODE_OAUTH_TOKEN: ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN },
                timeout_ms: AGENT_TIMEOUT_MS,
                label: "Product Diff agent",
            });

            stage = "read preview-agent output";
            const [rawManifest, rawBaseHtml, rawHeadHtml] = await Promise.all([
                sandbox.files.read(`${OUTPUT_DIR}/manifest.json`),
                sandbox.files.read(`${OUTPUT_DIR}/base.html`),
                sandbox.files.read(`${OUTPUT_DIR}/head.html`),
            ]);
            stage = "validate preview-agent output";
            const output = validate_product_diff_output(rawManifest, rawBaseHtml, rawHeadHtml);

            stage = "recheck PR before upload";
            const beforeUpload = await GithubService.getPullRequest(
                githubToken,
                project.githubRepoFullName,
                productDiff.pullNumber,
            );
            if (!is_current_product_diff(beforeUpload, productDiff.baseSha, productDiff.headSha)) {
                await sandbox.kill();
                sandbox = null;
                await prisma.productDiff.updateMany({
                    where: { id: productDiffId, status: "Generating" },
                    data: { status: "Stale" },
                });
                return;
            }

            const prefix = `product-diffs/${project.id}/${productDiff.pullNumber}/${productDiff.baseSha}-${productDiff.headSha}/${productDiff.id}`;
            stage = "upload Product Diff artifacts";
            await upload_product_diff_artifacts(prefix, output.baseHtml, output.headHtml);

            stage = "recheck PR after upload";
            const afterUpload = await GithubService.getPullRequest(
                githubToken,
                project.githubRepoFullName,
                productDiff.pullNumber,
            );
            const current = is_current_product_diff(
                afterUpload,
                productDiff.baseSha,
                productDiff.headSha,
            );
            stage = "destroy preview sandbox";
            await sandbox.kill();
            sandbox = null;
            stage = "publish Product Diff";
            await prisma.productDiff.updateMany({
                where: { id: productDiffId, status: "Generating" },
                data: {
                    status: current ? "Ready" : "Stale",
                    manifest: output.manifest as unknown as Prisma.InputJsonValue,
                    artifactPrefix: prefix,
                },
            });
        } catch (error) {
            if (sandbox) {
                try {
                    await sandbox.kill();
                } catch {
                    // E2B timeout remains final cleanup.
                }
            }
            const message = redact(describe_product_diff_failure(stage, error), [
                githubToken,
                ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN,
            ]).slice(0, 500);
            log.error("generation failed", new Error(message));
            await prisma.productDiff.updateMany({
                where: { id: productDiffId, status: "Generating" },
                data: { status: "Failed", error: message },
            });
        }
    }
}
