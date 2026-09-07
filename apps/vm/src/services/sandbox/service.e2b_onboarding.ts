import { prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";

import PlanService from "../context/service.plan";
import SandboxLifecycle from "./service.e2b_sandbox";
import { describe_failure, failure_sentence } from "./service.stream";

export default class OnboardingRunner {
    public static async run(
        session_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
    ): Promise<void> {
        const log = Logger.scope("onboard");
        let sandbox_id: string | null = null;
        log.step("onboarding started", {
            session: session_id,
            repo: github_repo_url,
            branch,
        });
        try {
            await Promise.all([
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: "Provisioning" },
                }),
                PlanService.mark_generating(project_id),
            ]);

            sandbox_id = await SandboxLifecycle.create();
            log.info("sandbox created", { sandbox: sandbox_id });
            await prisma.setupSession.update({
                where: { id: session_id },
                data: { sandboxId: sandbox_id, status: "Cloning" },
            });

            await SandboxLifecycle.clone_repo(
                sandbox_id,
                github_repo_url,
                branch,
                installation_id,
                project_id,
                log,
            );
            const commit_sha = await SandboxLifecycle.head_commit(sandbox_id);
            log.info("repo cloned", { commit: commit_sha.slice(0, 7) });

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Detecting" },
            });

            console.log("cloned the repo and now generating the brief for the repo");
            // const brief = await PlanService.generate_plan(sandbox_id);
            // console.log(chalk.green("brief is : "), brief);
            // await PlanService.set_plan(project_id, brief.planMd, commit_sha);
            // await ConsumptionLog.record({
            //     stage: "onboard",
            //     phase: "brief",
            //     repo: github_repo_url,
            //     issue: "—",
            //     model: brief.model,
            //     effort: brief.effort,
            //     cost_usd: brief.costUsd,
            //     num_turns: brief.numTurns,
            //     duration_ms: brief.durationMs,
            //     outcome: `brief generated @ ${commit_sha.slice(0, 7)}`,
            // });

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Ready", finishedAt: new Date() },
            });
            log.success("onboarding ready", { session: session_id });
        } catch (error) {
            const failure = describe_failure("onboard project", error, []);
            log.error("onboarding failed", error, {
                session: session_id,
                project: project_id,
                sandbox: sandbox_id,
                stage: failure.stage,
            });
            try {
                await Promise.all([
                    prisma.setupSession.update({
                        where: { id: session_id },
                        data: {
                            status: "Failed",
                            error: failure_sentence(failure),
                            finishedAt: new Date(),
                        },
                    }),
                    PlanService.mark_failed(project_id),
                ]);
            } catch (e) {
                log.error("could not mark session Failed", e, { session: session_id });
            }
        } finally {
            if (sandbox_id) {
                try {
                    await SandboxLifecycle.destroy(sandbox_id);
                    log.info("sandbox destroyed", { sandbox: sandbox_id });
                } catch (e) {
                    log.error("sandbox teardown failed", e, { sandbox: sandbox_id });
                }
            }
        }
    }
}
