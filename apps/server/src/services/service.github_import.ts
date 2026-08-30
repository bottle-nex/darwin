import { Action, Permissions } from "@trymatcha/access-control";
import { GithubImportTarget, prisma } from "@trymatcha/database";
import { type GithubIssuePayload, IMPORTED_TAG_COLOR, IMPORTED_TAG_NAME } from "@trymatcha/types";

import { server_services } from "..";
import Access from "../access-control/access";
import GithubAppService from "./service.github_app";
import GithubBodyService from "./service.github_body";
import IssueService from "./service.issue";

export const BACKFILL_PAGE_SIZE = 100;
export const BACKFILL_MAX_ISSUES = 500;

type RepoRef = {
    installationId: number;
    owner: string;
    repo: string;
};

type ImportConfig = {
    id: string;
    projectId: string;
    target: GithubImportTarget | null;
    customColumnId: string | null;
    tagId: string | null;
    configuredById: string;
};

export default class GithubImportService {
    static async import_issue(repo_id: string, payload: GithubIssuePayload): Promise<void> {
        const projects = await prisma.project.findMany({
            where: {
                githubRepoId: BigInt(repo_id),
                githubIssueImport: { enabled: true },
            },
            select: {
                id: true,
                githubRepoFullName: true,
                githubInstallation: { select: { installationId: true } },
                githubIssueImport: true,
            },
        });

        for (const project of projects) {
            if (!project.githubIssueImport) continue;
            await this.import_into_project(
                project.githubIssueImport,
                payload,
                this.repo_ref(project.githubRepoFullName, project.githubInstallation),
            );
        }
    }

    private static repo_ref(
        full_name: string | null,
        installation: { installationId: bigint } | null,
    ): RepoRef | null {
        if (!full_name || !installation) return null;
        const [owner, repo] = full_name.split("/");
        if (!owner || !repo) return null;
        return { installationId: Number(installation.installationId), owner, repo };
    }

    static async backfill(project_id: string, page: number): Promise<void> {
        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: {
                githubRepoFullName: true,
                githubInstallation: { select: { installationId: true } },
                githubIssueImport: true,
            },
        });

        const config = project?.githubIssueImport;
        if (!project || !config || !config.enabled) return;

        const repo_ref = this.repo_ref(project.githubRepoFullName, project.githubInstallation);
        if (!repo_ref) return;
        if (page * BACKFILL_PAGE_SIZE > BACKFILL_MAX_ISSUES) {
            console.warn(
                `[github-import] backfill for project ${project_id} stopped at the ${BACKFILL_MAX_ISSUES}-issue cap`,
            );
            return;
        }

        let issues;
        try {
            const octokit = await GithubAppService.octokitFor(repo_ref.installationId);
            const response = await octokit.rest.issues.listForRepo({
                owner: repo_ref.owner,
                repo: repo_ref.repo,
                state: "open",
                per_page: BACKFILL_PAGE_SIZE,
                page,
                headers: { accept: "application/vnd.github.full+json" },
            });
            issues = response.data;
        } catch (error) {
            await this.disable_on_lost_access(project_id, error);
            throw error;
        }

        for (const issue of issues) {
            if (issue.pull_request) continue;
            if (!issue.user?.login) continue;

            const rendered = (issue as unknown as { body_html?: string }).body_html;

            await this.import_into_project(
                config,
                {
                    githubIssueId: String(issue.id),
                    number: issue.number,
                    title: issue.title,
                    body: rendered ? GithubBodyService.sanitize(rendered) : (issue.body ?? ""),
                    url: issue.html_url,
                    authorLogin: issue.user.login,
                    authorAvatar: issue.user.avatar_url ?? null,
                },
                null,
            );
        }

        if (issues.length === BACKFILL_PAGE_SIZE) {
            await server_services.queue.enqueue_github_backfill(project_id, page + 1);
        }
    }

    private static async import_into_project(
        config: ImportConfig & { enabled?: boolean },
        payload: GithubIssuePayload,
        repo: RepoRef | null,
    ): Promise<void> {
        if (!this.is_ready_to_import(config)) {
            console.warn(
                `[github-import] project ${config.projectId} has no usable landing spot — skipping`,
            );
            return;
        }

        const existing = await prisma.githubIssueLink.findUnique({
            where: {
                projectId_githubIssueId: {
                    projectId: config.projectId,
                    githubIssueId: BigInt(payload.githubIssueId),
                },
            },
            select: { id: true },
        });
        if (existing) return;

        const creator = await this.resolve_creator(config, payload.authorLogin);
        const tag_id = await this.resolve_tag(config);
        const description = repo
            ? ((await GithubBodyService.fetch_rendered_body(
                  repo.installationId,
                  repo.owner,
                  repo.repo,
                  payload.number,
              )) ?? payload.body)
            : payload.body;

        await IssueService.create_issue({
            project_id: config.projectId,
            title: payload.title,
            description,
            custom_column_id: this.landing_column_id(config),
            tag_ids: [tag_id],
            created_by: creator,
            github_link: {
                githubIssueId: payload.githubIssueId,
                number: payload.number,
                url: payload.url,
                authorLogin: payload.authorLogin,
                authorAvatar: payload.authorAvatar,
            },
        });
    }

    private static is_ready_to_import(config: ImportConfig): boolean {
        if (config.target === GithubImportTarget.AgentBoard) return true;
        return config.target === GithubImportTarget.CustomColumn && Boolean(config.customColumnId);
    }

    private static landing_column_id(config: ImportConfig): string | undefined {
        return config.target === GithubImportTarget.CustomColumn
            ? (config.customColumnId ?? undefined)
            : undefined;
    }

    private static async resolve_creator(
        config: ImportConfig,
        author_login: string,
    ): Promise<{ id: string; name: string }> {
        const account = await prisma.githubAccount.findFirst({
            where: { githubLogin: author_login },
            select: { user: { select: { id: true, name: true } } },
        });

        if (account) {
            const role = await Access.project(account.user.id, config.projectId);
            if (role && Permissions.project(role, Action.project.create_issue)) {
                return { id: account.user.id, name: account.user.name ?? author_login };
            }
        }

        const admin = await prisma.user.findUniqueOrThrow({
            where: { id: config.configuredById },
            select: { id: true, name: true },
        });
        return { id: admin.id, name: admin.name ?? "GitHub import" };
    }

    static async ensure_imported_tag(project_id: string, created_by_id: string): Promise<string> {
        const tag = await prisma.tag.upsert({
            where: { projectId_name: { projectId: project_id, name: IMPORTED_TAG_NAME } },
            create: {
                projectId: project_id,
                name: IMPORTED_TAG_NAME,
                color: IMPORTED_TAG_COLOR,
                createdById: created_by_id,
            },
            update: {},
            select: { id: true },
        });
        return tag.id;
    }

    private static async resolve_tag(config: ImportConfig): Promise<string> {
        if (config.tagId) return config.tagId;

        const tag_id = await this.ensure_imported_tag(config.projectId, config.configuredById);
        await prisma.githubIssueImport.update({
            where: { id: config.id },
            data: { tagId: tag_id },
        });

        return tag_id;
    }

    private static async disable_on_lost_access(project_id: string, error: unknown): Promise<void> {
        const status = (error as { status?: number })?.status;
        if (status !== 401 && status !== 403 && status !== 404) return;

        await prisma.githubIssueImport.update({
            where: { projectId: project_id },
            data: { enabled: false },
        });
        console.warn(
            `[github-import] project ${project_id} lost GitHub access (${status}) — import disabled`,
        );
    }
}
