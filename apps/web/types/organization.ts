export type OrgRole = "Owner" | "Admin" | "Member" | "Billing";

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
    memberCount: number;
    projectCount: number;
    role: OrgRole;
}

export interface PreloadData {
    hasOrganization: boolean;
    organizations: Organization[];
}
