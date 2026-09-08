import { Harness, IssueStatus, prisma, WorkerStatus } from "@trydarwin/database";
import Logger from "@trydarwin/logger";

import { ENV } from "../conf/config.env";
import E2B from "../services/sandbox/service.e2b";

const log = Logger.scope("solve");

/**
 * Manual test entrypoint that bypasses the router's LLM assignment step, but otherwise
 * drives the exact same path a real dispatch does: create a Worker + a Queued Issue by
 * hand, then call E2B.run_worker_loop like the dispatch consumer would. Useful for
 * exercising the sandbox -> Claude Code -> sandbox-mcp -> server loop against one issue
 * without waiting on routing. Run with: bun run solve <projectId> ["issue description"]
 */
const HARDCODED_ISSUE = {
    title: "Fix the typo in the root README",
    description: `The project's root README.md has a typo in its first heading or intro line.
Find it and correct it. Keep the change minimal and scoped to that one fix.`,
};

async function main() {
    const project_id = process.argv[2];
    const override_description = process.argv[3];
    const issue = override_description
        ? {
              title: override_description.slice(0, 77).trim() + "...",
              description: override_description,
          }
        : HARDCODED_ISSUE;

    if (!project_id) {
        log.error('usage: bun run solve <projectId> ["issue description"]');
        process.exit(1);
    }

    log.step("looking up project", { project: project_id });
    const project = await prisma.project.findUnique({
        where: { id: project_id },
        select: {
            id: true,
            ownerId: true,
            githubRepoUrl: true,
            githubDefaultBranch: true,
            githubInstallation: { select: { installationId: true } },
        },
    });

    if (!project) {
        log.error("no project found", undefined, { project: project_id });
        process.exit(1);
    }
    if (!project.githubRepoUrl || !project.githubDefaultBranch || !project.githubInstallation) {
        log.error("project is missing repo url / default branch / github installation", undefined, {
            project: project_id,
        });
        process.exit(1);
    }

    log.info("project resolved", {
        repo: project.githubRepoUrl,
        branch: project.githubDefaultBranch,
    });
    log.block(`issue: ${issue.title}`, issue.description);

    const worker = await prisma.worker.create({
        data: { projectId: project.id, status: WorkerStatus.Booting },
    });
    log.success("worker created", { worker: worker.id });

    const last_issue = await prisma.issue.findFirst({
        where: { projectId: project.id },
        orderBy: { number: "desc" },
        select: { number: true },
    });
    const created_issue = await prisma.issue.create({
        data: {
            projectId: project.id,
            createdById: project.ownerId,
            number: (last_issue?.number ?? 0) + 1,
            title: issue.title,
            description: issue.description,
            status: IssueStatus.Queued,
            assignerWorkerId: worker.id,
            queuePosition: 1,
        },
    });
    log.success("issue queued", { number: `#${created_issue.number}`, issue: created_issue.id });

    // This script bypasses the router, which is normally what materializes IssueConfig —
    // do it here too so IssueSolver's claim never falls back to a bare platform default.
    await prisma.issueConfig.create({
        data: {
            issueId: created_issue.id,
            harness: Harness.Claude,
            model: ENV.VM_SOLVE_MODEL,
        },
    });

    await E2B.run_worker_loop(worker.id);

    log.success("done — check the worker for final status / PR info", { worker: worker.id });
    await prisma.$disconnect();
}

main().catch(async (err) => {
    log.error("fatal error", err);
    await prisma.$disconnect();
    process.exit(1);
});
