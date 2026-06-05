import { OrgRole, ProjectRole, TeamRole } from "@trymatcha/types";
import Action from "./actions";

export type OrgAction = (typeof Action.org)[keyof typeof Action.org];
export type ProjectAction = (typeof Action.project)[keyof typeof Action.project];
export type TeamAction = (typeof Action.team)[keyof typeof Action.team];

const ORG_PERMISSIONS: Record<OrgRole, Set<OrgAction>> = {
    [OrgRole.Owner]: new Set([
        Action.org.read,
        Action.org.update,
        Action.org.delete,
        Action.org.invite_member,
        Action.org.remove_member,
        Action.org.change_member_role,
        Action.org.manage_billing,
        Action.org.create_project,
        Action.org.manage_connectors,
    ]),
    [OrgRole.Admin]: new Set([
        Action.org.read,
        Action.org.update,
        Action.org.invite_member,
        Action.org.remove_member,
        Action.org.change_member_role,
        Action.org.create_project,
        Action.org.manage_connectors,
    ]),
    [OrgRole.Member]: new Set([Action.org.read]),
    [OrgRole.Billing]: new Set([Action.org.read, Action.org.manage_billing]),
};

const PROJECT_PERMISSIONS: Record<ProjectRole, Set<ProjectAction>> = {
    [ProjectRole.Admin]: new Set([
        Action.project.read,
        Action.project.update,
        Action.project.delete,
        Action.project.create_team,
        Action.project.manage_team,
        Action.project.create_issue,
        Action.project.triage_issue,
        Action.project.close_issue,
        Action.project.assign_issue,
        Action.project.trigger_runner,
        Action.project.cancel_runner,
        Action.project.view_runner_logs,
        Action.project.manage_connectors,
    ]),
    [ProjectRole.Maintain]: new Set([
        Action.project.read,
        Action.project.update,
        Action.project.create_team,
        Action.project.manage_team,
        Action.project.create_issue,
        Action.project.triage_issue,
        Action.project.close_issue,
        Action.project.assign_issue,
        Action.project.trigger_runner,
        Action.project.cancel_runner,
        Action.project.view_runner_logs,
        Action.project.manage_connectors,
    ]),
    [ProjectRole.Write]: new Set([
        Action.project.read,
        Action.project.create_issue,
        Action.project.triage_issue,
        Action.project.close_issue,
        Action.project.assign_issue,
        Action.project.trigger_runner,
        Action.project.view_runner_logs,
    ]),
    [ProjectRole.Triage]: new Set([
        Action.project.read,
        Action.project.create_issue,
        Action.project.triage_issue,
        Action.project.view_runner_logs,
    ]),
    [ProjectRole.Read]: new Set([Action.project.read, Action.project.view_runner_logs]),
};

const TEAM_PERMISSIONS: Record<TeamRole, Set<TeamAction>> = {
    [TeamRole.Maintainer]: new Set([
        Action.team.read,
        Action.team.update,
        Action.team.add_member,
        Action.team.remove_member,
        Action.team.change_member_role,
    ]),
    [TeamRole.Member]: new Set([Action.team.read]),
};

export default class Permissions {
    static org(role: OrgRole, action: OrgAction): boolean {
        return ORG_PERMISSIONS[role]?.has(action) ?? false;
    }

    static project(role: ProjectRole, action: ProjectAction): boolean {
        return PROJECT_PERMISSIONS[role]?.has(action) ?? false;
    }

    static team(role: TeamRole, action: TeamAction): boolean {
        return TEAM_PERMISSIONS[role]?.has(action) ?? false;
    }

    static has_implicit_project_access(role: OrgRole): boolean {
        return role === OrgRole.Owner || role === OrgRole.Admin;
    }
}
