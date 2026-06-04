"use client";
import React, { createContext, useContext, useState } from "react";
import { Action, Permissions } from "@trymatcha/access-control";
import type { OrgAction, ProjectAction, TeamAction } from "@trymatcha/access-control";

export type OrgRole = "Owner" | "Admin" | "Member" | "Billing";
export type ProjectRole = "Admin" | "Maintain" | "Write" | "Triage" | "Read";
export type TeamRole = "Maintainer" | "Member";

export type { OrgAction, ProjectAction, TeamAction };

interface AccessControlContext {
    orgRole: OrgRole | null;
    projectRole: ProjectRole | null;
    teamRole: TeamRole | null;
    setOrgRole: (role: OrgRole | null) => void;
    setProjectRole: (role: ProjectRole | null) => void;
    setTeamRole: (role: TeamRole | null) => void;
    org: (action: OrgAction) => boolean;
    project: (action: ProjectAction) => boolean;
    team: (action: TeamAction) => boolean;
}

const AccessControlContext = createContext<AccessControlContext | null>(null);

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
    const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
    const [projectRole, setProjectRole] = useState<ProjectRole | null>(null);
    const [teamRole, setTeamRole] = useState<TeamRole | null>(null);

    const org = (action: OrgAction) =>
        orgRole !== null &&
        Permissions.org(orgRole as Parameters<typeof Permissions.org>[0], action);

    const project = (action: ProjectAction) =>
        projectRole !== null &&
        Permissions.project(projectRole as Parameters<typeof Permissions.project>[0], action);

    const team = (action: TeamAction) =>
        teamRole !== null &&
        Permissions.team(teamRole as Parameters<typeof Permissions.team>[0], action);

    return React.createElement(
        AccessControlContext.Provider,
        {
            value: {
                orgRole,
                projectRole,
                teamRole,
                setOrgRole,
                setProjectRole,
                setTeamRole,
                org,
                project,
                team,
            },
        },
        children,
    );
}

export function useAccessControl() {
    const ctx = useContext(AccessControlContext);
    if (!ctx) throw new Error("useAccessControl must be used inside AccessControlProvider");
    return ctx;
}

export { Action };
