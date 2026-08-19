import { randomBytes } from "node:crypto";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { redis } from "./service.redis";
import { ENV } from "../configs/env";

/**
 * Context stashed in Redis while the browser is away at GitHub. Keyed by an
 * opaque `state` token so the callback can prove the round-trip belongs to the
 * matcha user/org that started it.
 */
export interface GithubOAuthState {
    orgId: string;
    userId: string;
}

/** Minimal repo shape returned to the client (ids stringified to dodge BigInt). */
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

/** Identity of the GitHub account that an installation belongs to. */
export interface InstallationAccount {
    accountLogin: string;
    accountType: string;
    accountId: number;
}

const STATE_TTL_SECONDS = 600;

/**
 * Stateless helper around the GitHub App + OAuth integration.
 *
 * The App is registered with "Request user authorization (OAuth) during
 * installation", so a single install redirect returns both an `installation_id`
 * and an OAuth `code`. This service builds that install URL, exchanges the code
 * for a user token, and mints short-lived installation tokens (via
 * `@octokit/auth-app`, which caches them) for acting on the org's repos.
 *
 * All methods are static; the class is purely a namespace.
 */
export default class GithubService {
    /** App-level auth (JWT + installation tokens). Lazily built, cached for the process. */
    private static _appAuth: ReturnType<typeof createAppAuth> | null = null;
    /** Octokit authenticated as the App itself (for `/app/*` endpoints). */
    private static _appOctokit: Octokit | null = null;

    /** Decode the base64-encoded PEM stored in env back into a usable private key. */
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

    private static state_key(state: string) {
        return `gh:oauth:state:${state}`;
    }

    /** Mint and persist a single-use `state` token bound to `{orgId, userId}`. */
    static async create_state(payload: GithubOAuthState): Promise<string> {
        const state = randomBytes(32).toString("hex");
        await redis.set(this.state_key(state), JSON.stringify(payload), "EX", STATE_TTL_SECONDS);
        return state;
    }

    /**
     * Atomically read and delete the `state` token, returning its payload (or
     * `null` if unknown/expired/already used). Single-use by deletion.
     */
    static async consume_state(state: string): Promise<GithubOAuthState | null> {
        const key = this.state_key(state);
        const raw = await redis.getdel(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as GithubOAuthState;
        } catch {
            return null;
        }
    }

    /** Build the App installation URL the browser is redirected to, carrying `state`. */
    static buildInstallUrl(state: string): string {
        const slug = encodeURIComponent(ENV.SERVER_GITHUB_APP_SLUG);
        return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
    }

    /**
     * Exchange the OAuth `code` from the install redirect for a user access
     * token. Hand-rolled `fetch` (single call) to avoid an extra octokit dep.
     */
    static async exchangeOAuthCode(code: string): Promise<{
        accessToken: string;
        refreshToken?: string;
        expiresAt?: Date;
        scope?: string;
    }> {
        const res = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                client_id: ENV.SERVER_GITHUB_APP_CLIENT_ID,
                client_secret: ENV.SERVER_GITHUB_APP_CLIENT_SECRET,
                code,
            }),
        });

        const data = (await res.json()) as {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
            scope?: string;
            error?: string;
            error_description?: string;
        };

        if (data.error || !data.access_token) {
            throw new Error(`github oauth exchange failed: ${data.error ?? "no access_token"}`);
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt:
                typeof data.expires_in === "number"
                    ? new Date(Date.now() + data.expires_in * 1000)
                    : undefined,
            scope: data.scope,
        };
    }

    /**
     * Mint a short-lived (~1h) installation access token. `@octokit/auth-app`
     * caches it internally, so repeated calls within the window are cheap.
     */
    static async getInstallationToken(installationId: number): Promise<string> {
        const auth = await this.appAuth()({ type: "installation", installationId });
        return auth.token;
    }

    static async getPullRequest(
        installationId: number,
        owner: string,
        repo: string,
        pullNumber: number,
    ): Promise<{ state: string; baseSha: string; headSha: string }> {
        const token = await this.getInstallationToken(installationId);
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
        });
        return { state: data.state, baseSha: data.base.sha, headSha: data.head.sha };
    }

    static async findOpenPullRequestByBranch(
        installationId: number,
        owner: string,
        repo: string,
        branch: string,
    ): Promise<{ url: string } | null> {
        const token = await this.getInstallationToken(installationId);
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: "open",
            head: `${owner}:${branch}`,
            per_page: 1,
        });
        return data[0] ? { url: data[0].html_url } : null;
    }

    static async listPullRequestFiles(
        installationId: number,
        owner: string,
        repo: string,
        pullNumber: number,
    ): Promise<string[]> {
        const token = await this.getInstallationToken(installationId);
        const octokit = new Octokit({ auth: token });
        const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
            owner,
            repo,
            pull_number: pullNumber,
            per_page: 100,
        });
        return files.map((file) => file.filename);
    }

    /**
     * Read an installation as the App itself — confirms it exists under this App
     * and surfaces the account that installed it. Used to verify the
     * `installation_id` from the callback rather than trusting it blindly.
     */
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

    /** List every repo the installation can access (paginated), as {@link RepoSummary}. */
    static async listInstallationRepos(installationId: number): Promise<RepoSummary[]> {
        const token = await this.getInstallationToken(installationId);
        const octokit = new Octokit({ auth: token });
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

    /** Resolve the GitHub identity behind a user OAuth token. */
    static async getAuthenticatedUser(userToken: string): Promise<{ id: number; login: string }> {
        const octokit = new Octokit({ auth: userToken });
        const { data } = await octokit.rest.users.getAuthenticated();
        return { id: data.id, login: data.login };
    }

    static async listRepoBranches(
        installationId: number,
        owner: string,
        repo: string,
    ): Promise<BranchSummary[]> {
        const token = await this.getInstallationToken(installationId);
        const octokit = new Octokit({ auth: token });
        console.log("owner is : ", owner, "repo is : ", repo);
        const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
            owner,
            repo,
            per_page: 100,
        });
        return branches.map((branch) => ({ name: branch.name }));
    }
}
