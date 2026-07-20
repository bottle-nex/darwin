import {} from "node:events";
import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { Prisma, prisma, ProjectRole } from "@trymatcha/database";
import RepoBrief from "../../services/service.repo_brief";

const PROJECT_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
];

function random_color() {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
}

const body_schema = z.object({
    org_id: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
    repo: z
        .object({
            githubRepoId: z.union([z.string(), z.number()]),
            fullName: z.string().min(1),
            htmlUrl: z.string().url(),
            defaultBranch: z.string().min(1),
        })
        .optional(),
});

export default async function create_project_controller(req: Request, res: Response) {
    try {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid data provided");
            return;
        }

        const { org_id, name, slug, description, repo } = parsed.data;
        const user_id = req.user.id;

        const org_role = await Access.org(user_id, org_id);
        if (!org_role || !Permissions.org(org_role, Action.org.create_project)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to create projects in this org",
            );
            return;
        }

        let repo_fields = {};
        let brief_target: {
            installationId: number;
            owner: string;
            repo: string;
            branch: string;
        } | null = null;

        if (repo) {
            const installation = await prisma.githubInstallation.findUnique({
                where: { orgId: org_id },
                select: { id: true, installationId: true, orgId: true },
            });
            if (!installation) {
                ResponseWriter.custom(
                    res,
                    false,
                    "NOT_CONNECTED",
                    "Connect GitHub before attaching a repository to a project.",
                    400,
                );
                return;
            }
            repo_fields = {
                githubInstallationId: installation.id,
                githubRepoId: BigInt(repo.githubRepoId),
                githubRepoFullName: repo.fullName,
                githubRepoUrl: repo.htmlUrl,
                githubDefaultBranch: repo.defaultBranch,
            };

            const [owner, repo_name] = repo.fullName.split("/");
            brief_target = {
                installationId: Number(installation.installationId),
                owner,
                repo: repo_name,
                branch: repo.defaultBranch,
            };
        }

        const project = await prisma.project.create({
            data: {
                orgId: org_id,
                name,
                slug,
                description,
                color: random_color(),
                ownerId: user_id,
                createdById: user_id,
                members: {
                    create: { userId: user_id, role: ProjectRole.Admin },
                },
                projectConfig: {
                    create: {},
                },
                ...repo_fields,
            },
            select: { id: true, name: true, slug: true, color: true },
        });

        ResponseWriter.created(res, project, "Project created successfully");

        if (brief_target) {
            void RepoBrief.get_brief(
                brief_target.installationId,
                brief_target.owner,
                brief_target.repo,
                brief_target.branch,
            ).catch((error) => console.error("repo brief failed:", error));
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            ResponseWriter.custom(res, false, "SLUG_TAKEN", "That slug is already taken.", 409);
            return;
        }
        console.error("error in create_project_controller:", error);
        ResponseWriter.system_error(res);
    }
}
