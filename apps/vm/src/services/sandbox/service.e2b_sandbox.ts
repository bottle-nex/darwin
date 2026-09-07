import type Logger from "@trymatcha/logger";
import type { CommandResult, SnapshotInfo } from "e2b";
import { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";
import {
    has_node_project,
    install_dependencies,
    pick_package_manager,
} from "../capsule/service.workspace";
import GithubService from "../platform/service.github";
import SecretService from "../platform/service.secret";
import {
    CLONE_TIMEOUT_MS,
    REPO_DIR,
    SANDBOX_TIMEOUT_MS,
    validate_branch,
} from "./service.e2b.constants";
import SandboxStream, { describe_failure, failure_sentence } from "./service.stream";

export default class SandboxLifecycle {
    public static async create(timeout_ms: number = SANDBOX_TIMEOUT_MS): Promise<string> {
        const sandbox = await Sandbox.create(ENV.VM_SANDBOX_TEMPLATE, {
            apiKey: ENV.VM_E2B_API_KEY,
            timeoutMs: timeout_ms,
        });
        return sandbox.sandboxId;
    }

    public static async destroy(sandbox_id: string): Promise<void> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        await sandbox.kill();
    }

    public static async pause(sandbox_id: string): Promise<boolean> {
        return Sandbox.pause(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        return Sandbox.createSnapshot(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
    }

    public static async exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        return sandbox.commands.run(command);
    }

    public static async exec_js_code(sandbox_id: string, code: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        const result = await sandbox.commands.run(`node -e '${code}'`);
        return result.stdout;
    }

    public static async head_commit(sandbox_id: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        const result = await sandbox.commands.run("git rev-parse HEAD", { cwd: REPO_DIR });
        return result.stdout.trim();
    }

    // Re-points origin at a fresh installation token, since clone_repo's baked-in token expires after an hour.
    public static async refresh_origin(
        sandbox: Sandbox,
        repo_url: string,
        token: string,
    ): Promise<void> {
        const authenticated = repo_url.replace("https://", `https://x-access-token:${token}@`);
        try {
            await sandbox.commands.run(`git remote set-url origin ${authenticated}`, {
                cwd: REPO_DIR,
            });
        } catch (error) {
            throw new Error(failure_sentence(describe_failure("refresh origin", error, [token])));
        }
    }

    public static async clone_repo(
        sandbox_id: string,
        repo_url: string,
        branch: string,
        installation_id: number,
        project_id: string,
        log: Logger,
    ): Promise<void> {
        validate_branch(branch);

        const [token, secrets] = await Promise.all([
            GithubService.getInstallationToken(installation_id),
            SecretService.get_all_secrets(project_id),
        ]);

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });

        await SandboxLifecycle.run_clone_command(sandbox, repo_url, branch, token, log);
        await SandboxLifecycle.write_secrets_env_file(sandbox, secrets);
        await SandboxLifecycle.install_repo_dependencies(sandbox, log);
    }

    private static async run_clone_command(
        sandbox: Sandbox,
        repo_url: string,
        branch: string,
        token: string,
        log: Logger,
    ): Promise<void> {
        const clone_url = repo_url.replace("https://", `https://x-access-token:${token}@`);

        // `--progress` forces git to report over a non-tty stderr; the stream and failure path are both redacted since git echoes the token-bearing URL back on failure.
        const stream = SandboxStream.plain(log, [token]);
        try {
            await sandbox.commands.run(
                `git clone --progress --depth 1 --branch ${branch} --single-branch ${clone_url} ${REPO_DIR}`,
                {
                    timeoutMs: CLONE_TIMEOUT_MS,
                    onStdout: stream.onStdout,
                    onStderr: stream.onStderr,
                },
            );
        } catch (error) {
            throw new Error(failure_sentence(describe_failure("clone repo", error, [token])));
        } finally {
            stream.flush();
        }
    }

    private static async write_secrets_env_file(
        sandbox: Sandbox,
        secrets: Record<string, string>,
    ): Promise<void> {
        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write(`${REPO_DIR}/.env`, env_file);
    }

    // Best-effort: an uninstallable repo still solves fine without deps, but a failed install must not leave a live pre-push hook nothing can satisfy.
    private static async install_repo_dependencies(sandbox: Sandbox, log: Logger): Promise<void> {
        const root_entries = (await sandbox.files.list(REPO_DIR)).map((entry) => entry.name);
        if (!has_node_project(root_entries)) {
            log.info("no package.json at the repository root — skipping dependency install");
            return;
        }

        try {
            await install_dependencies(sandbox, pick_package_manager(root_entries), log, false);
        } catch (error) {
            log.warn("dependency install failed — continuing without it", {
                error: String(error),
            });
            await sandbox.commands
                .run("git config --unset-all core.hooksPath", { cwd: REPO_DIR })
                .catch(() => null);
        }
    }
}
