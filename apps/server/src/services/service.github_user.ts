import { randomBytes } from "node:crypto";

import { Octokit } from "@octokit/rest";
import { prisma } from "@trydarwin/database";

import { ENV } from "../configs/env";
import { redis } from "./service.redis";

export interface GithubOAuthState {
    userId: string;
    orgId?: string;
}

export interface GithubOAuthGrant {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
}

const STATE_TTL_SECONDS = 600;
const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const EXPIRY_SKEW_MS = 60_000;

interface TokenResponse {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
}

export default class GithubUserService {
    private static state_key(state: string) {
        return `gh:oauth:state:${state}`;
    }

    static async create_state(payload: GithubOAuthState): Promise<string> {
        const state = randomBytes(32).toString("hex");
        await redis.set(this.state_key(state), JSON.stringify(payload), "EX", STATE_TTL_SECONDS);
        return state;
    }

    static async consume_state(state: string): Promise<GithubOAuthState | null> {
        const raw = await redis.getdel(this.state_key(state));
        if (!raw) return null;
        try {
            return JSON.parse(raw) as GithubOAuthState;
        } catch {
            return null;
        }
    }

    static buildAuthorizeUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: ENV.GITHUB_APP_CLIENT_ID,
            state,
        });
        return `https://github.com/login/oauth/authorize?${params}`;
    }

    static async exchangeOAuthCode(code: string): Promise<GithubOAuthGrant> {
        return this.token_request({ code });
    }

    static async getAuthenticatedUser(userToken: string): Promise<{ id: number; login: string }> {
        const octokit = new Octokit({ auth: userToken });
        const { data } = await octokit.rest.users.getAuthenticated();
        return { id: data.id, login: data.login };
    }

    static async link(
        userId: string,
        grant: GithubOAuthGrant,
        github: { id: number; login: string },
    ) {
        const identity = {
            githubUserId: BigInt(github.id),
            githubLogin: github.login,
            accessToken: grant.accessToken,
            refreshToken: grant.refreshToken,
            expiresAt: grant.expiresAt,
            scope: grant.scope,
        };
        await prisma.githubAccount.upsert({
            where: { userId },
            create: { userId, ...identity },
            update: identity,
        });
    }

    static async user_token(userId: string): Promise<string | null> {
        const account = await prisma.githubAccount.findUnique({
            where: { userId },
            select: { accessToken: true, refreshToken: true, expiresAt: true },
        });
        if (!account) return null;

        const expired = account.expiresAt
            ? account.expiresAt.getTime() - EXPIRY_SKEW_MS <= Date.now()
            : false;
        if (!expired) return account.accessToken;
        if (!account.refreshToken) return null;

        try {
            const refreshed = await this.token_request({ refresh_token: account.refreshToken });
            await prisma.githubAccount.update({
                where: { userId },
                data: {
                    accessToken: refreshed.accessToken,
                    refreshToken: refreshed.refreshToken,
                    expiresAt: refreshed.expiresAt,
                    scope: refreshed.scope,
                },
            });
            return refreshed.accessToken;
        } catch (error) {
            console.error("[github] user token refresh failed", error);
            return null;
        }
    }

    private static async token_request(
        grant: { code: string } | { refresh_token: string },
    ): Promise<GithubOAuthGrant> {
        const res = await fetch(TOKEN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                client_id: ENV.GITHUB_APP_CLIENT_ID,
                client_secret: ENV.GITHUB_APP_CLIENT_SECRET,
                ...("code" in grant ? grant : { grant_type: "refresh_token", ...grant }),
            }),
        });

        const data = (await res.json()) as TokenResponse;
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
}
