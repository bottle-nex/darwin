export type TeamRole = "Maintainer" | "Member";

export interface TeamMemberDetail {
    id: string;
    role: TeamRole;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}
