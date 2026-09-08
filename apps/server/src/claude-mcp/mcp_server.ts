import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Action, Permissions } from "@trydarwin/access-control";
import { z } from "zod";

import Access from "../access-control/access";
import IssueService from "../services/service.issue";
import type { AuthUser } from "../types/express";
import { resolve_assignee } from "./lib/resolve_assignee";
import { resolve_project } from "./lib/resolve_project";

function text(message: string) {
    return { content: [{ type: "text" as const, text: message }] };
}

export function build_claude_mcp_server(user: AuthUser): McpServer {
    const mcp_server = new McpServer({
        name: "darwin-mcp",
        version: "0.1.0",
    });

    mcp_server.tool(
        "create_issue",
        "Create an issue on a darwin project board. `project` is required and matched fuzzily " +
            "against the projects you have access to; pass `org` too if the project name is ambiguous " +
            'across organizations. `assignee` is matched fuzzily against project members — pass "me" ' +
            "to assign yourself. If a project or assignee can't be confidently resolved, this returns " +
            "close matches instead of failing outright; re-call with a more precise value.",
        {
            project: z.string().min(1),
            org: z.string().min(1).optional(),
            title: z.string().min(1).max(80),
            description: z.string().min(1).max(20000),
            assignee: z.string().min(1).optional(),
        },
        async ({ project, org, title, description, assignee }) => {
            const project_resolution = await resolve_project(user.id, project, org);
            if (!project_resolution.ok) {
                if (!project_resolution.suggestions.length) {
                    return text(
                        `No project matching "${project}" was found in your accessible projects.`,
                    );
                }
                return text(
                    "Multiple projects could match. Please re-call with a more specific `project` " +
                        `(and \`org\` if needed):\n${project_resolution.suggestions
                            .map((p) => `- "${p.name}" in org "${p.orgName}"`)
                            .join("\n")}`,
                );
            }

            const role = await Access.project(user.id, project_resolution.project.id);
            if (!role || !Permissions.project(role, Action.project.create_issue)) {
                return text("You don't have permission to create issues in this project.");
            }

            let assignee_ids: string[] | undefined;
            if (assignee) {
                const assignee_resolution = await resolve_assignee(
                    user,
                    project_resolution.project.id,
                    assignee,
                );
                if (!assignee_resolution.ok) {
                    if (!assignee_resolution.suggestions.length) {
                        return text(
                            `No project member matching "${assignee}" was found. Try "me" to assign yourself.`,
                        );
                    }
                    return text(
                        "Multiple members could match. Please re-call with a more specific " +
                            `\`assignee\`:\n${assignee_resolution.suggestions
                                .map((a) => `- ${a.name} (${a.email})`)
                                .join("\n")}`,
                    );
                }
                assignee_ids = [assignee_resolution.assignee.id];
            }

            if (!assignee_ids?.length) {
                return text(
                    "An assignee is required to create an issue. Pass `assignee` " +
                        '(a project member\'s name, or "me" to assign yourself).',
                );
            }

            const full_issue = await IssueService.create_issue({
                project_id: project_resolution.project.id,
                title,
                description,
                assignee_ids,
                created_by: { id: user.id, name: user.name },
            });

            if (!full_issue) {
                return text("Something went wrong while creating the issue. Please try again.");
            }

            return text(
                `Created issue #${full_issue.number} "${full_issue.title}" in ` +
                    `${project_resolution.project.name} (${project_resolution.project.orgName}), ` +
                    `assigned to ${full_issue.assignees.map((a) => a.name ?? a.email).join(", ")}.`,
            );
        },
    );

    return mcp_server;
}
