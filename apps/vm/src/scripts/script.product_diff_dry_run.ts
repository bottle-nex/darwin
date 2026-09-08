import "../conf/config.env";

import { Prisma, prisma } from "@trydarwin/database";
import Logger from "@trydarwin/logger";

import ProductDiffRunner from "../services/capsule/service.product_diff";

const log = Logger.scope("diff-dry-run");

/**
 * Runs the Product Diff pipeline against a chosen pull request without waiting for a solve.
 *
 * Reaching this pipeline the normal way means filing an issue, waiting for the agent to finish and
 * open a pull request, and only then waiting out a forty-five minute preview — which is not a loop
 * anyone can debug a scaffolding problem in. This creates the row directly and runs it.
 *
 * Run with:
 *   bun run src/scripts/script.product_diff_dry_run.ts --issue <issueId> --pull 42 --base <sha> --head <sha>
 */

function flag(name: string): string | null {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

async function main() {
    const issueId = flag("issue");
    const pull = flag("pull");
    const baseSha = flag("base");
    const headSha = flag("head");

    if (!issueId || !pull || !baseSha || !headSha) {
        log.error("usage: --issue <issueId> --pull <number> --base <sha> --head <sha>", undefined, {
            hint: "the issue must belong to a project with a linked GitHub installation",
        });
        process.exit(1);
    }

    const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: { id: true, number: true, project: { select: { name: true } } },
    });
    if (!issue) {
        log.error("no such issue", undefined, { issue: issueId });
        process.exit(1);
    }

    const productDiff = await prisma.productDiff.upsert({
        where: {
            issueId_baseSha_headSha: { issueId, baseSha, headSha },
        },
        create: { issueId, pullNumber: Number(pull), baseSha, headSha },
        update: { status: "Pending", error: null, manifest: Prisma.DbNull, artifactPrefix: null },
        select: { id: true },
    });

    log.step("running the Product Diff pipeline", {
        product_diff: productDiff.id,
        project: issue.project.name,
        issue: `#${issue.number}`,
        pull: `#${pull}`,
    });

    await ProductDiffRunner.run(productDiff.id);

    const finished = await prisma.productDiff.findUniqueOrThrow({
        where: { id: productDiff.id },
        select: { status: true, error: true, artifactPrefix: true, manifest: true },
    });
    log.info("finished", {
        status: finished.status,
        prefix: finished.artifactPrefix ?? "-",
        error: finished.error ?? "-",
    });
    if (finished.manifest) log.block("manifest", JSON.stringify(finished.manifest, null, 2));

    process.exit(finished.status === "Ready" ? 0 : 1);
}

main().catch((error) => {
    log.error("dry run failed", error);
    process.exit(1);
});
