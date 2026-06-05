export type OrgRole = "Owner" | "Admin" | "Member" | "Billing";

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
    memberCount: number;
    projectCount: number;
    githubConnected: boolean;
    role: OrgRole;
}

export interface GithubRepo {
    id: string;
    fullName: string;
    htmlUrl: string;
    private: boolean;
    defaultBranch: string;
    language: string | null;
    updatedAt: string | null;
}
