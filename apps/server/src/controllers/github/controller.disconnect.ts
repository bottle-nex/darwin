import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    orgId: z.string().min(1),
});

/**
 * `DELETE /github/connect/:orgId` — disconnect the org's GitHub installation.
 *
 * Deletes the matcha-side link (projects keep their repo metadata but lose the
 * live `githubInstallation` relation via `onDelete: SetNull`). This does NOT
 * uninstall the App on GitHub — the user must revoke that from GitHub settings.
 */
export default class DisconnectController {
    static async process(req: Request, res: Response) {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "orgId is required");
        }

        try {
            const { orgId } = parsed.data;
            const userId = req.user.id;

            const role = await Access.org(userId, orgId);
            if (!role || !Permissions.org(role, Action.org.manage_connectors)) {
                return ResponseWriter.not_authorized(
                    res,
                    "You don't have permission to disconnect GitHub for this org",
                );
            }

            await prisma.githubInstallation.deleteMany({ where: { orgId } });

            return ResponseWriter.success(
                res,
                { manageUrl: "https://github.com/settings/installations" },
                "GitHub disconnected. To fully revoke access, uninstall the app from GitHub settings.",
            );
        } catch (error) {
            console.error("error in disconnect controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
