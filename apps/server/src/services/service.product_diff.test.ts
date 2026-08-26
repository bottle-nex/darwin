import { Prisma } from "@trymatcha/database";
import { afterEach, expect, mock, spyOn, test } from "bun:test";

import GithubPullsService from "./service.github_pulls";
import StorageService from "./service.storage";

const productDiffPrisma = {
    issue: { findUnique: mock() },
    productDiff: { upsert: mock(), updateMany: mock() },
};

mock.module("@trymatcha/database", () => ({ Prisma, prisma: productDiffPrisma }));

const { default: ProductDiffService } = await import("./service.product_diff");

afterEach(() => {
    mock.restore();
});

test("retryable_product_diff_status excludes configuration-required runs", () => {
    expect(ProductDiffService.retryable_product_diff_status("PreviewUnavailable")).toBe(true);
    expect(ProductDiffService.retryable_product_diff_status("ConfigurationRequired")).toBe(false);
});

test("retrying a preview-unavailable Product Diff clears terminal diagnostics", async () => {
    spyOn(StorageService, "is_product_diff_configured").mockReturnValue(true);
    productDiffPrisma.issue.findUnique.mockResolvedValue({
        prUrl: "https://github.com/acme/storefront/pull/42",
        project: {
            githubRepoFullName: "acme/storefront",
            githubRepoId: BigInt(1),
            githubInstallation: { installationId: BigInt(2) },
            projectConfig: { productDiffEnabled: true },
        },
    } as never);
    spyOn(GithubPullsService, "getPullRequest").mockResolvedValue({
        state: "open",
        baseSha: "base-sha",
        headSha: "head-sha",
    });
    spyOn(GithubPullsService, "listPullRequestFiles").mockResolvedValue([
        {
            filename: "app/page.tsx",
            previousFilename: null,
            status: "modified",
            additions: 1,
            deletions: 0,
            htmlUrl: null,
            patch: null,
        },
    ]);
    productDiffPrisma.productDiff.upsert.mockResolvedValue({
        id: "product-diff-1",
        status: "PreviewUnavailable",
    } as never);
    productDiffPrisma.productDiff.updateMany.mockResolvedValue({
        count: 1,
    } as never);

    expect(await ProductDiffService.prepare("issue-1", true)).toEqual({ id: "product-diff-1" });
    expect(productDiffPrisma.productDiff.updateMany).toHaveBeenCalledWith({
        where: {
            id: "product-diff-1",
            status: { in: ["Failed", "PreviewUnavailable"] },
        },
        data: { status: "Pending", error: null, diagnostics: Prisma.DbNull },
    });
});
