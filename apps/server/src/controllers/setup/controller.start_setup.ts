import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import SecretService from "../../services/service.secret";
import z from "zod";
import { prisma } from "@trymatcha/database";
import E2B from "../../sandbox/e2b";

const body_schema = z.object({
    github_repo_id: z.bigint(),
    github_repo_full_name: z.string().nonempty(),
    github_repo_url: z.string().nonempty(),
    github_default_branch: z.string().default("main"),
    envs: z.array(
        z.object({
            key: z.string().nonempty(),
            value: z.string().nonempty(),
        }),
    ),
    extra_context: z.string().optional(),
});

const params_schema = z.object({
    project_id: z.string().nonempty(),
});

export default async function start_setup(req: Request, res: Response) {
    try {
        const parsed_body = body_schema.safeParse(req.body);
        const parsed_params = params_schema.safeParse(req.params);

        if (!parsed_body.success || !parsed_params.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const {
            github_repo_id,
            github_repo_full_name,
            github_repo_url,
            github_default_branch,
            envs,
        } = parsed_body.data;
        const { project_id } = parsed_params.data;

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            include: { organization: { include: { githubInstallation: true } } },
        });

        if (!project) {
            ResponseWriter.not_found(res, "project not found");
            return;
        }

        const github_installation = project.organization.githubInstallation;
        if (!github_installation) {
            ResponseWriter.custom(
                res,
                false,
                "GITHUB_NOT_CONNECTED",
                "GitHub is not connected for this organization. Please connect GitHub first.",
                400,
            );
            return;
        }

        const [updated_project, session] = await Promise.all([
            prisma.project.update({
                where: { id: project_id },
                data: {
                    githubRepoId: github_repo_id,
                    githubRepoFullName: github_repo_full_name,
                    githubRepoUrl: github_repo_url,
                    githubDefaultBranch: github_default_branch,
                    githubInstallationId: github_installation.id,
                },
            }),
            prisma.setupSession.create({
                data: { projectId: project_id, status: "Pending", startedAt: new Date() },
            }),
        ]);

        await Promise.all(
            envs.map(({ key, value }) => SecretService.set_secret(project_id, key, value)),
        );

        ResponseWriter.created(res, { project: updated_project, session });

        E2B.run_setup_job(
            session.id,
            project_id,
            github_repo_url,
            Number(github_installation.installationId),
        );
    } catch (error) {
        console.error("error in start setup controller: ", error);
        ResponseWriter.system_error(res);
        return;
    }
}
