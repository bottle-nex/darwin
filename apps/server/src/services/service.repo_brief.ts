import { Sandbox } from "e2b";
import { ENV } from "../configs/env";
import GithubService from "./service.github";


export default class RepoBrief {
    static readonly REPO_DIR = "/home/user/repo";
    public static async get_brief(
        installation_id: number,
        owner: string,
        repo: string,
        branch: string,
    ) {
        const sandbox = await RepoBrief.clone_repo(installation_id, owner, repo, branch);
        try {
            const tree = await sandbox.commands.run(
                `find . -maxdepth 2 -not -path './.git/*' | sort | head -n 200`,
                { cwd: RepoBrief.REPO_DIR },
            );

            const packageJson = await RepoBrief.read_if_exists(sandbox, `${RepoBrief.REPO_DIR}/package.json`);
            const readme = await RepoBrief.read_if_exists(sandbox, `${RepoBrief.REPO_DIR}/README.md`);

            return {
                owner,
                repo,
                branch,
                tree: tree.stdout,
                packageJson,
                readme,
            };
        } finally {
            await sandbox.kill();
        }
    }

    public static async clone_repo(
        installation_id: number,
        owner: string,
        repo: string,
        branch: string,
    ): Promise<Sandbox> {
        const token = await GithubService.getInstallationToken(installation_id);
        const url = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

        const sandbox = await Sandbox.create({
            apiKey: ENV.SERVER_E2B_API_KEY,
            timeoutMs: 5 * 60_000,
        });

        const result = await sandbox.commands.run(
            `git clone --depth 1 --single-branch --branch ${branch} ${url} ${RepoBrief.REPO_DIR}`,
            { timeoutMs: 4 * 60_000 },
        );

        if (result.exitCode !== 0) {
            await sandbox.kill();
            const reason = result.stderr.split(token).join("***");
            throw new Error(`git clone failed for ${owner}/${repo}#${branch}: ${reason}`);
        }

        return sandbox;
    }

    private static async read_if_exists(sandbox: Sandbox, path: string): Promise<string | null> {
        try {
            return await sandbox.files.read(path);
        } catch {
            return null;
        }
    }
}
