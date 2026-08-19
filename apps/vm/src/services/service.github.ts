import { createAppAuth } from "@octokit/auth-app";
import { ENV } from "../conf/config.env";

export interface PullRequestSummary {
    number: number;
    htmlUrl: string;
}

/** GitHub access needed by coding and Product Diff workers. Full OAuth stays in the server. */
export default class GithubService {
    private static _appAuth: ReturnType<typeof createAppAuth> | null = null;

    private static appAuth() {
        if (!this._appAuth) {
            this._appAuth = createAppAuth({
                appId: ENV.SERVER_GITHUB_APP_ID,
                privateKey: Buffer.from(ENV.SERVER_GITHUB_APP_PRIVATE_KEY, "base64").toString(
                    "utf8",
                ),
                clientId: ENV.SERVER_GITHUB_APP_CLIENT_ID,
                clientSecret: ENV.SERVER_GITHUB_APP_CLIENT_SECRET,
            });
        }
        return this._appAuth;
    }

    /** Mint a ~1h installation access token. `@octokit/auth-app` caches internally. */
    static async getInstallationToken(
        installationId: number,
        repositoryId?: number,
    ): Promise<string> {
        const auth = await this.appAuth()({
            type: "installation",
            installationId,
            ...(repositoryId
                ? {
                      repositoryIds: [repositoryId],
                      permissions: { contents: "read", pull_requests: "read" },
                  }
                : {}),
        });
        return auth.token;
    }

    static async getPullRequest(
        token: string,
        fullName: string,
        pullNumber: number,
    ): Promise<{ state: string; baseSha: string; headSha: string }> {
        const response = await fetch(
            `https://api.github.com/repos/${fullName}/pulls/${pullNumber}`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            },
        );
        if (!response.ok) throw new Error(`GitHub pull request lookup failed (${response.status})`);
        const pull = (await response.json()) as {
            state: string;
            base: { sha: string };
            head: { sha: string };
        };
        return { state: pull.state, baseSha: pull.base.sha, headSha: pull.head.sha };
    }

    static async listOpenPullRequests(
        token: string,
        fullName: string,
        owner: string,
        headBranch: string,
        baseBranch: string,
    ): Promise<PullRequestSummary[]> {
        const query = new URLSearchParams({
            state: "open",
            head: `${owner}:${headBranch}`,
            base: baseBranch,
            per_page: "100",
        });
        const response = await fetch(`https://api.github.com/repos/${fullName}/pulls?${query}`, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        if (!response.ok) throw new Error(`GitHub pull request lookup failed (${response.status})`);
        const pulls = (await response.json()) as Array<{
            number: number;
            html_url: string;
        }>;
        return pulls.map((pull) => ({
            number: pull.number,
            htmlUrl: pull.html_url,
        }));
    }

    static async createPullRequest(
        token: string,
        fullName: string,
        pull: { head: string; base: string; title: string; body: string },
    ): Promise<PullRequestSummary> {
        const response = await fetch(`https://api.github.com/repos/${fullName}/pulls`, {
            method: "POST",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(pull),
        });
        if (!response.ok) {
            const detail = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(
                `GitHub pull request creation failed (${response.status})${detail?.message ? `: ${detail.message}` : ""}`,
            );
        }
        const created = (await response.json()) as { number: number; html_url: string };
        return { number: created.number, htmlUrl: created.html_url };
    }
}
