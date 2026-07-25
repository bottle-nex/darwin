import { createAppAuth } from "@octokit/auth-app";
import { ENV } from "../conf/config.env";

/**
 * The worker's only need from GitHub: a short-lived installation token to clone
 * the project's repo with. The full App/OAuth integration stays in the server.
 */
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
    static async getInstallationToken(installationId: number): Promise<string> {
        const auth = await this.appAuth()({ type: "installation", installationId });
        return auth.token;
    }
}
