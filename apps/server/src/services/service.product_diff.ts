import { extname } from "node:path";
import { prisma } from "@trymatcha/database";
import type { ProductDiffStatus, ProductDiffSummary } from "@trymatcha/types";
import GithubService from "./service.github";
import StorageService from "./service.storage";

const FRONTEND_EXTENSIONS = new Set([".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss", ".html"]);

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
            GithubService.getPullRequest(installationId, owner, repo, pullNumber),
            GithubService.listPullRequestFiles(installationId, owner, repo, pullNumber),
        ]);
        if (pull.state !== "open" || !this.has_frontend_candidate(files)) return null;

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
}
