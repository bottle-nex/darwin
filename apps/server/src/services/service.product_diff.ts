import { extname } from "node:path";
import { prisma } from "@trymatcha/database";
import type { ProductDiffStatus, ProductDiffSummary } from "@trymatcha/types";
import GithubPullsService from "./service.github_pulls";
import StorageService from "./service.storage";

const FRONTEND_EXTENSIONS = new Set([".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss", ".html"]);
const STALE_GENERATING_MS = 90 * 60 * 1000;
const ORPHANED_PENDING_MS = 10 * 60 * 1000;

type ProductDiffSummaryRow = {
    id: string;
    issueId: string;
    baseSha: string;
    headSha: string;
    status: ProductDiffStatus;
    error: string | null;
    issue: { number: number; title: string; prUrl: string | null };
};

export default class ProductDiffService {
    static has_frontend_candidate(files: string[]): boolean {
        return files.some((file) => FRONTEND_EXTENSIONS.has(extname(file).toLowerCase()));
    }

    static pull_number_from_url(pr_url: string): number {
        const url = new URL(pr_url);
        const parts = url.pathname.split("/").filter(Boolean);
        const pull_number = Number(parts[3]);
        if (
            url.hostname !== "github.com" ||
            parts.length !== 4 ||
            parts[2] !== "pull" ||
            !Number.isInteger(pull_number) ||
            pull_number < 1
        ) {
            throw new Error("invalid GitHub pull request URL");
        }
        return pull_number;
    }

    static to_summary(row: ProductDiffSummaryRow): ProductDiffSummary {
        return {
            id: row.id,
            issueId: row.issueId,
            issueNumber: row.issue.number,
            issueTitle: row.issue.title,
            prUrl: row.issue.prUrl ?? "",
            baseSha: row.baseSha,
            headSha: row.headSha,
            status: row.status,
            error: row.error,
        };
    }

    static async prepare(issueId: string, retry_failed = false): Promise<{ id: string } | null> {
        if (!StorageService.is_product_diff_configured()) return null;

        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: {
                prUrl: true,
                project: {
                    select: {
                        githubRepoFullName: true,
                        githubRepoId: true,
                        githubInstallation: { select: { installationId: true } },
                        projectConfig: { select: { productDiffEnabled: true } },
                    },
                },
            },
        });
        const project = issue?.project;
        if (
            !issue?.prUrl ||
            !project?.projectConfig?.productDiffEnabled ||
            !project.githubRepoFullName ||
            !project.githubRepoId ||
            !project.githubInstallation
        ) {
            return null;
        }

        const [owner, repo] = project.githubRepoFullName.split("/");
        if (!owner || !repo) return null;

        const pullNumber = this.pull_number_from_url(issue.prUrl);
        const installationId = Number(project.githubInstallation.installationId);
        const [pull, files] = await Promise.all([
            GithubPullsService.getPullRequest(installationId, owner, repo, pullNumber),
            GithubPullsService.listPullRequestFiles({ installationId, owner, repo, pullNumber }),
        ]);
        if (
            pull.state !== "open" ||
            !this.has_frontend_candidate(files.map((file) => file.filename))
        )
            return null;

        let productDiff = await prisma.productDiff.upsert({
            where: {
                issueId_baseSha_headSha: { issueId, baseSha: pull.baseSha, headSha: pull.headSha },
            },
            create: { issueId, pullNumber, baseSha: pull.baseSha, headSha: pull.headSha },
            update: {},
            select: { id: true, status: true },
        });

        if (productDiff.status === "Failed" && retry_failed) {
            const reset = await prisma.productDiff.updateMany({
                where: { id: productDiff.id, status: "Failed" },
                data: { status: "Pending", error: null },
            });
            if (reset.count === 0) return null;
            productDiff = { id: productDiff.id, status: "Pending" };
        }

        return productDiff.status === "Pending" ? { id: productDiff.id } : null;
    }

    /**
     * Fails Product Diff rows that have been generating for longer than any run can legitimately take.
     *
     * A worker that dies mid-run never writes a finishing status, so the row stays Generating and
     * the reviews panel polls it every three seconds forever. Screenshot runs take tens of minutes,
     * which makes a single restart enough to strand rows, so this sweep runs on boot and hourly.
     *
     * @example
     * await ProductDiffService.reap_stale_generating(); // 2 — two abandoned rows were closed out
     */
    /**
     * Finds Product Diff rows that were created but never queued for work.
     *
     * A row is normally queued in the same breath as it is created. One that is still waiting ten
     * minutes later was forgotten — by an older version of this code, or by a queue that was down
     * at the wrong moment. The ten minute wait is what stops this sending a second job for a row
     * that is simply about to be picked up.
     *
     * @example
     * await ProductDiffService.orphaned_pending(); // ["cmsz4ti8l00072jv953yr0uft"]
     */
    static async orphaned_pending(): Promise<string[]> {
        const cutoff = new Date(Date.now() - ORPHANED_PENDING_MS);
        const rows = await prisma.productDiff.findMany({
            where: { status: "Pending", createdAt: { lt: cutoff } },
            select: { id: true },
            take: 50,
        });
        return rows.map(({ id }) => id);
    }

    static async reap_stale_generating(): Promise<number> {
        const cutoff = new Date(Date.now() - STALE_GENERATING_MS);
        const reaped = await prisma.productDiff.updateMany({
            where: { status: "Generating", updatedAt: { lt: cutoff } },
            data: { status: "Failed", error: "Generation did not finish" },
        });
        return reaped.count;
    }
}
