import "../conf/config.env";
import chalk from "chalk";
import { prisma, WorkerStatus } from "@trymatcha/database";
import E2B from "../services/services.e2b";

/**
 * One-off entrypoint that bypasses the reconciler/router/dispatch pipeline entirely:
 * pass a projectId, get a hardcoded issue solved and a PR opened. Exists to prove the
 * sandbox -> Claude Code -> sandbox-mcp -> server loop end to end before that pipeline
 * is wired up to drive it for real. Run with: bun run solve <projectId> ["issue text"]
 */
const HARDCODED_ISSUE = `Title: Fix the typo in the root README

The project's root README.md has a typo in its first heading or intro line.
Find it and correct it. Keep the change minimal and scoped to that one fix.`;

async function main() {
    const project_id = process.argv[2];
    const issue_text = process.argv[3] ?? HARDCODED_ISSUE;

    if (!project_id) {
        console.error(chalk.red('usage: bun run solve <projectId> ["issue text"]'));
        process.exit(1);
    }

    console.log(chalk.cyan(`[solve] looking up project ${project_id}`));
    const project = await prisma.project.findUnique({
        where: { id: project_id },
        select: {
            id: true,
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
    console.log(chalk.cyan(`[solve] issue:\n${issue_text}`));

    console.log(chalk.cyan("[solve] creating worker row (writing to db)"));
    const worker = await prisma.worker.create({
        data: { projectId: project.id, status: WorkerStatus.Booting },
    });
    console.log(chalk.green(`[solve] worker created: ${worker.id}`));

    await E2B.run_issue_job(
        worker.id,
        project.id,
        project.githubRepoUrl,
        project.githubDefaultBranch,
        Number(project.githubInstallation.installationId),
        issue_text,
    );

    console.log(chalk.green(`[solve] done — check worker ${worker.id} for final status/PR info`));
    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error(chalk.red("[solve] fatal error:"), err);
    await prisma.$disconnect();
    process.exit(1);
});
