import type { Prisma } from "@trymatcha/database";
import { prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type { CapsuleManifest, ProductDiffStatus } from "@trymatcha/types";
import { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";
import GithubService from "../platform/service.github";
import E2B from "../sandbox/service.e2b";
import { command_error_text, describe_failure, failure_sentence } from "../sandbox/service.stream";
import CapsuleAuthor, { type CapsuleFailure, type CapsuleSpec } from "./service.author";
import CapsuleBuild, { dist_dir } from "./service.build";
import CapsuleHarness, { type CapsuleRevision } from "./service.harness";
import CapsuleTargets from "./service.targets";
import CapsuleUpload, { type GateResult, type GateResults } from "./service.upload";
import CapsuleWorkspace, {
    type AppProfile,
    InstallFailedError,
    NoFrontendAppError,
} from "./service.workspace";

const log = Logger.scope("product-diff");

const SANDBOX_TIMEOUT_MS = 40 * 60_000;
const CHECK_TIMEOUT_MS = 6 * 60_000;
const CHECK_ENTRY = "/opt/matcha/capsule-check/index.js";
const REVISIONS: CapsuleRevision[] = ["base", "head"];
const SAFE_SHA = /^[0-9a-f]{7,64}$/;

export const MAX_REPAIR_ROUNDS = 2;

export type BuildErrors = Record<CapsuleRevision, Record<string, string>>;

export function collect_failures(
    specs: CapsuleSpec[],
    gates: GateResults,
    build_errors: BuildErrors = { base: {}, head: {} },
): CapsuleFailure[] {
    const failures: CapsuleFailure[] = [];

    for (const spec of specs) {
        for (const revision of REVISIONS) {
            if (!spec.entries[revision]) continue;

            const gate = gates[revision][spec.id];
            if (!gate) {
                const build_error = build_errors[revision][spec.id];
                failures.push({
                    capsuleId: spec.id,
                    revision,
                    diagnostics: build_error
                        ? [`the ${revision} revision did not compile:`, build_error]
                        : [`the ${revision} revision did not build`],
                });
                continue;
            }
            if (gate.fidelity === "Failed") {
                failures.push({ capsuleId: spec.id, revision, diagnostics: gate.diagnostics });
            }
        }
    }
    return failures;
}

/**
 * A run that built nothing is a failure, not an absence.
 *
 * Reporting it as Unsupported tells the reviewer this pull request changes nothing worth looking
 * at, which is the most misleading thing it could say when every component failed to compile.
 */
export function terminal_status(manifest: CapsuleManifest, attempted: number): ProductDiffStatus {
    if (manifest.capsules.length > 0) return "Ready";
    return attempted > 0 ? "Failed" : "Unsupported";
}

export function first_build_error(build_errors: BuildErrors): string | null {
    for (const revision of REVISIONS) {
        for (const message of Object.values(build_errors[revision])) {
            if (message) return message;
        }
    }
    return null;
}

export default class ProductDiffRunner {
    public static async run(product_diff_id: string): Promise<ProductDiffStatus> {
        const row = await prisma.productDiff.findUnique({
            where: { id: product_diff_id },
            select: {
                baseSha: true,
                headSha: true,
                issue: {
                    select: {
                        project: {
                            select: {
                                id: true,
                                githubRepoUrl: true,
                                githubDefaultBranch: true,
                                githubInstallation: { select: { installationId: true } },
                            },
                        },
                    },
                },
            },
        });

        const project = row?.issue.project;
        if (
            !row ||
            !project?.githubRepoUrl ||
            !project.githubDefaultBranch ||
            !project.githubInstallation
        ) {
            return this.settle(
                product_diff_id,
                "Failed",
                "This project is not connected to GitHub",
            );
        }
        if (!SAFE_SHA.test(row.baseSha) || !SAFE_SHA.test(row.headSha)) {
            return this.settle(product_diff_id, "Failed", "This pull request has unusable commits");
        }

        await prisma.productDiff.updateMany({
            where: { id: product_diff_id, status: { in: ["Pending", "Generating"] } },
            data: { status: "Generating", error: null },
        });

        let sandbox_id: string | null = null;
        let token = "";

        try {
            sandbox_id = await E2B.create(SANDBOX_TIMEOUT_MS);
            token = await GithubService.getInstallationToken(
                Number(project.githubInstallation.installationId),
            );

            await E2B.clone_repo(
                sandbox_id,
                project.githubRepoUrl,
                project.githubDefaultBranch,
                Number(project.githubInstallation.installationId),
                project.id,
                log,
            );

            const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
            const status = await this.generate(sandbox, product_diff_id, row.baseSha, row.headSha);
            return status;
        } catch (error) {
            const failure = describe_failure("generate capsule diff", error, [
                token,
                ENV.VM_CLAUDE_CODE_OAUTH_TOKEN,
            ]);
            log.error("capsule diff run failed", new Error(failure.message), {
                productDiff: product_diff_id,
                base: row.baseSha.slice(0, 8),
                head: row.headSha.slice(0, 8),
                stage: failure.stage,
            });
            return this.settle(
                product_diff_id,
                "Failed",
                this.reason(error, failure_sentence(failure)),
            );
        } finally {
            if (sandbox_id) {
                await E2B.destroy(sandbox_id).catch((error) => {
                    log.error("sandbox teardown failed", error, { sandbox: sandbox_id });
                });
            }
        }
    }

    private static async generate(
        sandbox: Sandbox,
        product_diff_id: string,
        base_sha: string,
        head_sha: string,
    ): Promise<ProductDiffStatus> {
        const { profile } = await CapsuleWorkspace.prepare(sandbox, base_sha, head_sha, log);
        const { targets, warnings } = await CapsuleTargets.pick(
            sandbox,
            profile,
            base_sha,
            head_sha,
        );

        if (targets.length === 0) {
            return this.settle(
                product_diff_id,
                "Unsupported",
                "This pull request changes no previewable components",
            );
        }

        const authored = await CapsuleAuthor.write_capsules(sandbox, log, targets, profile);
        const specs = authored.specs;
        if (specs.length === 0) {
            return this.settle(
                product_diff_id,
                "Unsupported",
                "None of the changed components could be prepared for preview",
            );
        }

        await CapsuleHarness.install(sandbox, profile);

        let attempt = await this.build_and_check(sandbox, profile, specs, base_sha, head_sha);

        for (let round = 0; round < MAX_REPAIR_ROUNDS; round += 1) {
            const failures = collect_failures(specs, attempt.gates, attempt.buildErrors);
            if (failures.length === 0) break;

            log.info("retrying capsules that did not render", {
                round: round + 1,
                failing: failures.length,
            });
            await CapsuleAuthor.repair(sandbox, log, profile, failures);
            attempt = await this.build_and_check(sandbox, profile, specs, base_sha, head_sha);
        }
        const gates = attempt.gates;

        const { manifest, prefix } = await CapsuleUpload.publish(
            sandbox,
            product_diff_id,
            specs,
            gates,
            [...warnings, ...authored.warnings],
            log,
        );

        const status = terminal_status(manifest, specs.length);
        await prisma.productDiff.update({
            where: { id: product_diff_id },
            data: {
                status,
                manifest: manifest as unknown as Prisma.InputJsonValue,
                artifactPrefix: prefix,
                error:
                    status === "Failed"
                        ? (first_build_error(attempt.buildErrors) ??
                          "No component could be built for preview")
                        : null,
            },
        });

        return status;
    }

    private static async build_and_check(
        sandbox: Sandbox,
        profile: AppProfile,
        specs: CapsuleSpec[],
        base_sha: string,
        head_sha: string,
    ): Promise<{ gates: GateResults; buildErrors: BuildErrors }> {
        const gates: GateResults = { base: {}, head: {} };
        const buildErrors: BuildErrors = { base: {}, head: {} };

        for (const revision of REVISIONS) {
            const capsule_ids = await CapsuleHarness.write(sandbox, profile, specs, revision);
            if (capsule_ids.length === 0) continue;

            await CapsuleBuild.checkout_revision(
                sandbox,
                profile,
                revision,
                revision === "base" ? base_sha : head_sha,
                log,
            );

            const built: string[] = [];
            for (const capsule_id of capsule_ids) {
                const outcome = await CapsuleBuild.build_capsule(
                    sandbox,
                    profile,
                    revision,
                    capsule_id,
                );
                if (outcome.ok) {
                    built.push(capsule_id);
                    continue;
                }
                buildErrors[revision][capsule_id] =
                    outcome.error ?? "the build produced no error text";
                log.block(
                    `${revision} build failure — ${capsule_id}`,
                    buildErrors[revision][capsule_id]!,
                );
            }

            log.info(`${revision} revision built`, {
                built: built.length,
                failed: capsule_ids.length - built.length,
            });
            if (built.length > 0) gates[revision] = await this.check(sandbox, revision, built);
        }

        return { gates, buildErrors };
    }

    private static async check(
        sandbox: Sandbox,
        revision: CapsuleRevision,
        capsule_ids: string[],
    ): Promise<Record<string, GateResult>> {
        const result = await sandbox.commands
            .run(`node ${CHECK_ENTRY} ${dist_dir(revision)} '${JSON.stringify(capsule_ids)}'`, {
                timeoutMs: CHECK_TIMEOUT_MS,
            })
            .catch((error: unknown) => {
                log.block(`${revision} check failure`, command_error_text(error));
                return null;
            });

        if (!result) return {};

        const graded: Record<string, GateResult> = {};
        for (const line of result.stdout.split("\n")) {
            if (!line.trim()) continue;
            try {
                const gate = JSON.parse(line) as GateResult;
                graded[gate.capsuleId] = gate;
            } catch {
                log.warn("the capsule checker printed something unreadable");
            }
        }
        return graded;
    }

    private static reason(error: unknown, message: string): string {
        if (error instanceof NoFrontendAppError) return "No React application was found to preview";
        if (error instanceof InstallFailedError) {
            return `The project's dependencies could not be installed. ${message}`;
        }
        return message;
    }

    private static async settle(
        product_diff_id: string,
        status: ProductDiffStatus,
        error: string | null,
    ): Promise<ProductDiffStatus> {
        await prisma.productDiff.update({
            where: { id: product_diff_id },
            data: { status, error },
        });
        return status;
    }
}
