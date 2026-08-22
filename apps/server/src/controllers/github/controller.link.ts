import { prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import { z } from "zod";
import GithubUserService from "../../services/service.github_user";
import ResponseWriter from "../../services/service.response";

const complete_schema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});

export default class GithubLinkController {
    static async status(req: Request, res: Response) {
        try {
            const account = await prisma.githubAccount.findUnique({
                where: { userId: req.user.id },
                select: { githubLogin: true },
            });
            return ResponseWriter.success(res, account);
        } catch (error) {
            console.error("error in github link status controller", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async start(req: Request, res: Response) {
        try {
            const state = await GithubUserService.create_state({ userId: req.user.id });
            return ResponseWriter.redirect(
                res,
                GithubUserService.buildAuthorizeUrl(state),
                "Redirect to GitHub to link your account",
            );
        } catch (error) {
            console.error("error in github link start controller", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async complete(req: Request, res: Response) {
        const parsed = complete_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "code and state are required");
        }

        try {
            const { code, state } = parsed.data;
            const stored = await GithubUserService.consume_state(state);
            if (!stored || stored.userId !== req.user.id) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "INVALID_STATE",
                    "This GitHub link is invalid or has expired. Please try again.",
                    400,
                );
            }

            const grant = await GithubUserService.exchangeOAuthCode(code);
            const github = await GithubUserService.getAuthenticatedUser(grant.accessToken);
            await GithubUserService.link(req.user.id, grant, github);

            return ResponseWriter.created(
                res,
                { githubLogin: github.login },
                "GitHub account linked.",
            );
        } catch (error) {
            console.error("error in github link complete controller", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async unlink(req: Request, res: Response) {
        try {
            await prisma.githubAccount.deleteMany({ where: { userId: req.user.id } });
            return ResponseWriter.success(res, null, "GitHub account unlinked.");
        } catch (error) {
            console.error("error in github link unlink controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
