import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../configs/env";
import GithubService from "../services/service.github";
import SecretService from "../services/service.secret";
import PlanService from "../services/services.plan";
import { prisma } from "@trymatcha/database";

const REPO_DIR = "/home/user/repo";
const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;

export default class E2B {
    public static async run_onboarding_job(
        session_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
    ) {
        let sandbox_id: string | null = null;

        try {
            await Promise.all([
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: "Provisioning" },
                }),
                PlanService.mark_generating(project_id),
            ]);

            sandbox_id = await E2B.create();
            console.log("sand box id is : ", sandbox_id);

            let session = await prisma.setupSession.update({
                where: { id: session_id },
                data: { sandboxId: sandbox_id, status: "Cloning" },
            });

            console.log("session is : ", session);

            await E2B.clone_repo(sandbox_id, github_repo_url, branch, installation_id, project_id);
            const commit_sha = await E2B.head_commit(sandbox_id);
            console.log("commit sha is : ", commit_sha);
            session = await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Detecting" },
            });

            console.log("session is : ", session);

            const plan_md = await PlanService.generate_plan(sandbox_id);
            console.log("plan md is : ", plan_md);
            await PlanService.set_plan(project_id, plan_md, commit_sha);

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Ready", finishedAt: new Date() },
            });
        } catch (error) {
            console.error(`[onboarding] session ${session_id} failed:`, error);
            try {
                await Promise.all([
                    prisma.setupSession.update({
                        where: { id: session_id },
                        data: {
                            status: "Failed",
                            error: error instanceof Error ? error.message : String(error),
                            finishedAt: new Date(),
                        },
                    }),
                    PlanService.mark_failed(project_id),
                ]);
            } catch (e) {
                console.error(`[onboarding] failed to mark session as Failed:`, e);
            }
        } finally {
            if (sandbox_id) {
                try {
                    await E2B.destroy(sandbox_id);
                } catch (e) {
                    console.error(`[onboarding] failed to tear down sandbox ${sandbox_id}:`, e);
                }
            }
        }
    }

    public static async head_commit(sandbox_id: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run("git rev-parse HEAD", { cwd: REPO_DIR });
        return result.stdout.trim();
    }

    public static async create(): Promise<string> {
        const sandbox = await Sandbox.create("node-py-claude-template", {
            apiKey: ENV.SERVER_E2B_API_KEY,
        });
        return sandbox.sandboxId;
    }

    public static async exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run(command);
        return result;
    }

    public static async exec_js_code(sandbox_id: string, code: string) {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run(`node -e '${code}'`);
        console.log(result.stdout);
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        const snapshot = await Sandbox.createSnapshot(sandbox_id, {
            apiKey: ENV.SERVER_E2B_API_KEY,
        });
        return snapshot;
    }

    public static async pause(sandbox_id: string): Promise<boolean> {
        const status = await Sandbox.pause(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        return status;
    }

    public static async destroy(sandbox_id: string): Promise<void> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        await sandbox.kill();
    }

    public static async clone_repo(
        sandbox_id: string,
        repo_url: string,
        branch: string,
        installation_id: number,
        project_id: string,
    ) {
        if (!SAFE_BRANCH.test(branch)) {
            throw new Error(`refusing to clone unsafe branch name: ${branch}`);
        }

        const [token, secrets] = await Promise.all([
            GithubService.getInstallationToken(installation_id),
            SecretService.get_all_secrets(project_id),
        ]);

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const clone_url = repo_url.replace("https://", `https://x-access-token:${token}@`);

        await sandbox.commands.run(
            `git clone --branch ${branch} --single-branch ${clone_url} ${REPO_DIR}`,
            {
                onStdout: (data) => console.log(data),
                onStderr: (data) => console.error(data),
            },
        );

        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write(`${REPO_DIR}/.env`, env_file);
    }
}
