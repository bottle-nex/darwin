import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { signSessionJwt } from "../../services/service.jwt";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    user: z.object({
        email: z.email(),
        name: z.string().nullish(),
        image: z.string().nullish(),
    }),
    account: z.object({
        provider: z.enum(["google", "github"]),
    }),
});

export default class SignInController {
    /**
     * Handle `POST /auth/sign-in`: validate the OAuth provider payload, then upsert the
     * user (marking their email verified) and return a signed session JWT.
     *
     * The email is lower-cased before lookup so provider-supplied casing never creates a
     * duplicate account. The upsert refreshes `name`/`image` on every sign-in (leaving
     * them untouched when the provider omits them) and doubles as account creation, so no
     * separate sign-up step is needed.
     *
     * Responses: `200` `{ user, token }` · `400` invalid body · `500` on error.
     */
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Invalid sign-in payload");
        }
        const { email, name, image } = parsed.data.user;
        const normalizedEmail = email.toLowerCase();

        try {
            const user = await prisma.user.upsert({
                where: { email: normalizedEmail },
                create: {
                    email: normalizedEmail,
                    name: name ?? null,
                    image: image ?? null,
                    emailVerified: new Date(),
                },
                update: {
                    name: name ?? undefined,
                    image: image ?? undefined,
                    emailVerified: new Date(),
                },
                select: { id: true, email: true, name: true, image: true },
            });

            const token = signSessionJwt({
                id: user.id,
                name: user.name ?? "",
                email: normalizedEmail,
            });

            return ResponseWriter.success(res, { user, token }, "Signed in");
        } catch (err) {
            console.error("[sign-in]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
