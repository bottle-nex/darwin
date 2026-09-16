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
        return Buffer.from(ENV.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8");
    }

    private static appAuth() {
        if (!this._appAuth) {
            this._appAuth = createAppAuth({
                appId: ENV.GITHUB_APP_ID,
                privateKey: this.privateKey(),
                clientId: ENV.GITHUB_APP_CLIENT_ID,
                clientSecret: ENV.GITHUB_APP_CLIENT_SECRET,
            });
        }
        return this._appAuth;
    }

    private static appOctokit(): Octokit {
        if (!this._appOctokit) {
            this._appOctokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: ENV.GITHUB_APP_ID,
                    privateKey: this.privateKey(),
                },
            });
        }
        return this._appOctokit;
    }

    /**
     * `select_target` always shows GitHub's account chooser. `installations/new` only offers
     * one while the app is uninstalled — afterwards it silently reuses the existing install,
     * which is how every connection ended up on a personal account instead of an org.
     *
     * The explicit `redirect_uri` stops GitHub falling back to whichever callback URL happens
     * to be listed first on the app, which used to land installs on the NextAuth login route.
     */
    static buildInstallUrl(state: string): string {
        const slug = encodeURIComponent(ENV.SERVER_GITHUB_APP_SLUG);
        const redirectUri = encodeURIComponent(
            `${ENV.SERVER_WEB_URL}/integrations/github/callback`,
        );
        return (
            `https://github.com/apps/${slug}/installations/select_target` +
            `?state=${encodeURIComponent(state)}&redirect_uri=${redirectUri}`
        );
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
            accountType: account?.type ?? "Unknown",
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
