import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../configs/env";
import GithubService from "../services/service.github";
import SecretService from "../services/service.secret";

export default class E2B {

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
        const result = await sandbox.commands.run(`node -e \"${code}\"`);
        console.log(result.stdout);
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        const snapshot = await Sandbox.createSnapshot(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
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
        installation_id: number,
        project_id: string,
    ) {
        const [token, secrets] = await Promise.all([
            GithubService.getInstallationToken(installation_id),
            SecretService.get_all_secrets(project_id),
        ]);

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const clone_url = repo_url.replace("https://", `https://x-access-token:${token}@`);

        await sandbox.commands.run(`git clone ${clone_url} /home/user/repo`, {
            onStdout: (data) => console.log(data),
            onStderr: (data) => console.error(data),
        });

        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write("/home/user/repo/.env", env_file);
    }
}
