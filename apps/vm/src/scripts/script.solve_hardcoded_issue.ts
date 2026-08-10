import "../conf/config.env";
import chalk from "chalk";
import { prisma, IssueStatus, WorkerStatus } from "@trymatcha/database";
import E2B from "../services/services.e2b";

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
        console.error(chalk.red('usage: bun run solve <projectId> ["issue description"]'));
        process.exit(1);
    }

    console.log(chalk.cyan(`[solve] looking up project ${project_id}`));
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
        console.error(chalk.red(`[solve] no project found with id ${project_id}`));
        process.exit(1);
    }
    if (!project.githubRepoUrl || !project.githubDefaultBranch || !project.githubInstallation) {
        console.error(
            chalk.red(
                `[solve] project ${project_id} is missing repo url / default branch / github installation`,
            ),
        );
        process.exit(1);
    }

    console.log(chalk.cyan(`[solve] project resolved: ${project.githubRepoUrl}`));
    console.log(chalk.cyan(`[solve] issue: ${issue.title}\n${issue.description}`));

    console.log(chalk.cyan("[solve] creating worker row (writing to db)"));
    const worker = await prisma.worker.create({
        data: { projectId: project.id, status: WorkerStatus.Booting },
    });
    console.log(chalk.green(`[solve] worker created: ${worker.id}`));

    console.log(chalk.cyan("[solve] creating queued issue row (writing to db)"));
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
    console.log(
        chalk.green(`[solve] issue created: #${created_issue.number} (${created_issue.id})`),
    );

    await E2B.run_worker_loop(worker.id);

    console.log(chalk.green(`[solve] done — check worker ${worker.id} for final status/PR info`));
    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error(chalk.red("[solve] fatal error:"), err);
    await prisma.$disconnect();
    process.exit(1);
});
