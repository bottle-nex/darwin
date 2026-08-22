import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { ENV } from "../configs/env";

export interface RepoSummary {
    id: string;
    fullName: string;
    htmlUrl: string;
    private: boolean;
    defaultBranch: string;
    language: string | null;
    updatedAt: string | null;
}

export interface BranchSummary {
    name: string;
}

export interface InstallationAccount {
    accountLogin: string;
    accountType: string;
    accountId: number;
}

export default class GithubAppService {
    private static _appAuth: ReturnType<typeof createAppAuth> | null = null;
    private static _appOctokit: Octokit | null = null;

    private static privateKey(): string {
        return Buffer.from(ENV.SERVER_GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8");
    }

    private static appAuth() {
        if (!this._appAuth) {
            this._appAuth = createAppAuth({
                appId: ENV.SERVER_GITHUB_APP_ID,
                privateKey: this.privateKey(),
                clientId: ENV.SERVER_GITHUB_APP_CLIENT_ID,
                clientSecret: ENV.SERVER_GITHUB_APP_CLIENT_SECRET,
            });
        }
        return this._appAuth;
    }

    private static appOctokit(): Octokit {
        if (!this._appOctokit) {
            this._appOctokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: ENV.SERVER_GITHUB_APP_ID,
                    privateKey: this.privateKey(),
                },
            });
        }
        return this._appOctokit;
    }

    static buildInstallUrl(state: string): string {
        const slug = encodeURIComponent(ENV.SERVER_GITHUB_APP_SLUG);
        return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
    }

    static async getInstallationToken(installationId: number): Promise<string> {
        const auth = await this.appAuth()({ type: "installation", installationId });
        return auth.token;
    }

    static async octokitFor(installationId: number): Promise<Octokit> {
        return new Octokit({ auth: await this.getInstallationToken(installationId) });
    }

    static async getInstallation(installationId: number): Promise<InstallationAccount> {
        const { data } = await this.appOctokit().rest.apps.getInstallation({
            installation_id: installationId,
        });
        const account = data.account as { login?: string; type?: string; id?: number } | null;
        return {
            accountLogin: account?.login ?? "",
            accountType: account?.type ?? "Organization",
            accountId: account?.id ?? 0,
        };
    }

    static async listInstallationRepos(installationId: number): Promise<RepoSummary[]> {
        const octokit = await this.octokitFor(installationId);
        const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
            per_page: 100,
        });
        return repos.map((repo) => ({
            id: repo.id.toString(),
            fullName: repo.full_name,
            htmlUrl: repo.html_url,
            private: repo.private,
            defaultBranch: repo.default_branch,
            language: repo.language ?? null,
            updatedAt: repo.pushed_at ?? repo.updated_at ?? null,
        }));
    }

    static async listRepoBranches(
        installationId: number,
        owner: string,
        repo: string,
    ): Promise<BranchSummary[]> {
        const octokit = await this.octokitFor(installationId);
        const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
            owner,
            repo,
            per_page: 100,
        });
        return branches.map((branch) => ({ name: branch.name }));
    }
}
