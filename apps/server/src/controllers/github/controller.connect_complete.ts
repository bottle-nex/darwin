import { Request, Response } from "express";
import { z } from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import GithubService from "../../services/service.github";

const body_schema = z.object({
    installationId: z.coerce.number().int().positive(),
    code: z.string().min(1),
    state: z.string().min(1),
});

/**
 * `POST /github/connect/complete` — finish the install round-trip.
 *
 * Consumes the single-use `state` (deriving `orgId`/`userId` from it rather than
 * trusting the client), re-checks the caller's permission, exchanges the OAuth
 * `code` for a user token, verifies the installation belongs to this App, then
 * persists the user's GitHub identity and the org's installation.
 */
export default class ConnectCompleteController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "installationId, code and state are required");
        }

        try {
            const { installationId, code, state } = parsed.data;
            const userId = req.user.id;

            const stored = await GithubService.consume_state(state);
            if (!stored || stored.userId !== userId) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVALID_STATE",
                    "This GitHub connection link is invalid or has expired. Please try again.",
                    400,
                );
            }
            const { orgId } = stored;

            const role = await Access.org(userId, orgId);
            if (!role || !Permissions.org(role, Action.org.manage_connectors)) {
                return ResponseWriter.not_authorized(
                    res,
                    "You don't have permission to connect GitHub for this org",
                );
            }

            let account;
            try {
                account = await GithubService.getInstallation(installationId);
            } catch (err) {
                console.error("[github] getInstallation failed", err);
                return ResponseWriter.custom(
                    res,
                    false,
                    "INSTALLATION_NOT_FOUND",
                    "Could not verify the GitHub installation. Please try again.",
                    400,
                );
            }

            const oauth = await GithubService.exchangeOAuthCode(code);
            const ghUser = await GithubService.getAuthenticatedUser(oauth.accessToken);

            const org = await prisma.$transaction(async (tx) => {
                await tx.githubAccount.upsert({
                    where: { userId },
                    create: {
                        userId,
                        githubUserId: BigInt(ghUser.id),
                        githubLogin: ghUser.login,
                        accessToken: oauth.accessToken,
                        refreshToken: oauth.refreshToken,
                        expiresAt: oauth.expiresAt,
                        scope: oauth.scope,
                    },
                    update: {
                        githubUserId: BigInt(ghUser.id),
                        githubLogin: ghUser.login,
                        accessToken: oauth.accessToken,
                        refreshToken: oauth.refreshToken,
                        expiresAt: oauth.expiresAt,
                        scope: oauth.scope,
                    },
                });

                await tx.githubInstallation.create({
                    data: {
                        orgId,
                        installationId: BigInt(installationId),
                        accountLogin: account.accountLogin,
                        accountType: account.accountType,
                        accountId: BigInt(account.accountId),
                        connectedById: userId,
                    },
                });

                return tx.organization.findUnique({
                    where: { id: orgId },
                    select: { slug: true },
                });
            });

            return ResponseWriter.created(
                res,
                { orgId, orgSlug: org?.slug ?? null, accountLogin: account.accountLogin },
                "GitHub connected successfully.",
            );
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return ResponseWriter.custom(
                    res,
                    false,
                    "GITHUB_ALREADY_CONNECTED",
                    "This GitHub organization is already connected to another matcha organization.",
                    409,
                );
            }
            console.error("error in connect_complete controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
