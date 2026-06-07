// Mirrors the Prisma-generated enums (const object + string-literal union) so that
// values returned from the Prisma client are structurally assignable to these types.
// Keep in sync with the enums in packages/database/prisma/schema.prisma.

export const OrgRole = {
    Owner: "Owner",
    Admin: "Admin",
    Member: "Member",
    Billing: "Billing",
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const ProjectRole = {
    Admin: "Admin",
    Maintain: "Maintain",
    Write: "Write",
    Triage: "Triage",
    Read: "Read",
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const TeamRole = {
    Maintainer: "Maintainer",
    Member: "Member",
} as const;
export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const Chunk = {
    Imports: "Imports",
    Function: "Function",
    Class: "Class",
    Interface: "Interface",
    Type: "Type",
    Variable: "Variable",
    Block: "Block",
} as const;
export type Chunk = (typeof Chunk)[keyof typeof Chunk];
