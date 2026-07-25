import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import SecretService from "../../services/service.secret";
import z from "zod";
import { PlanStatus, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";
import { server_services } from "../..";

const body_schema = z.object({
    github_repo_id: z.bigint().optional(),
    github_repo_full_name: z.string().nonempty().optional(),
    github_repo_url: z.string().nonempty().optional(),
    github_default_branch: z.string().optional(),
    envs: z
        .array(
            z.object({
                key: z.string().nonempty(),
                value: z.string().nonempty(),
            }),
        )
        .optional(),
    extra_context: z.string().optional(),
});

const params_schema = z.object({
    project_id: z.string().nonempty(),
});

export default async function start_setup(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const parsed_body = body_schema.safeParse(req.body ?? {});
        const parsed_params = params_schema.safeParse(req.params);

        if (!parsed_body.success || !parsed_params.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const { project_id } = parsed_params.data;
        const {
            github_repo_id,
            github_repo_full_name,
            github_repo_url,
            github_default_branch,
            envs,
        } = parsed_body.data;

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.update)) {
            ResponseWriter.not_authorized(res, "You don't have permission to set up this project");
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            include: { organization: { include: { githubInstallation: true } } },
        });

        if (!project) {
            ResponseWriter.not_found(res, "project not found");
            return;
        }

        if (
            project.planStatus === PlanStatus.Generating ||
            project.planStatus === PlanStatus.Ready
        ) {
            ResponseWriter.custom(
                res,
                false,
                "PLAN_ALREADY_STARTED",
                "This project's brief has already been generated.",
                409,
            );
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

        const repo_url = github_repo_url ?? project.githubRepoUrl;
        const branch = github_default_branch ?? project.githubDefaultBranch ?? "main";
        if (!repo_url) {
            ResponseWriter.custom(
                res,
                false,
                "REPO_NOT_CONNECTED",
                "No repository is connected to this project. Connect one before generating a brief.",
                400,
            );
            return;
        }

        const has_repo_input = Boolean(github_repo_id && github_repo_full_name && github_repo_url);

        const [, session] = await Promise.all([
            has_repo_input
                ? prisma.project.update({
                      where: { id: project_id },
                      data: {
                          githubRepoId: github_repo_id,
                          githubRepoFullName: github_repo_full_name,
                          githubRepoUrl: github_repo_url,
                          githubDefaultBranch: branch,
                          githubInstallationId: github_installation.id,
                      },
                  })
                : Promise.resolve(null),
            prisma.setupSession.create({
                data: { projectId: project_id, status: "Pending", startedAt: new Date() },
            }),
        ]);

        if (envs && envs.length > 0) {
            await Promise.all(
                envs.map(({ key, value }) => SecretService.set_secret(project_id, key, value)),
            );
        }

        ResponseWriter.created(res, { session });

        try {
            await server_services.queue.enqueue_onboarding({
                session_id: session.id,
                project_id,
                repo_url,
                branch,
                installation_id: Number(github_installation.installationId),
            });
        } catch (error) {
            console.error("failed to enqueue onboarding job: ", error);
            await prisma.setupSession.update({
                where: { id: session.id },
                data: {
                    status: "Failed",
                    error: "could not queue the onboarding job",
                    finishedAt: new Date(),
                },
            });
        }
    } catch (error) {
        console.error("error in start setup controller: ", error);
        ResponseWriter.system_error(res);
        return;
    }
}
