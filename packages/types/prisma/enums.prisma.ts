export enum OrgRole {
    Owner = "Owner",
    Admin = "Admin",
    Member = "Member",
    Billing = "Billing",
}

export enum ProjectRole {
    Admin = "Admin",
    Maintain = "Maintain",
    Write = "Write",
    Triage = "Triage",
    Read = "Read",
}

export enum TeamRole {
    Maintainer = "Maintainer",
    Member = "Member",
}

export enum Chunk {
    Imports = "Imports",
    Function = "Function",
    Class = "Class",
    Interface = "Interface",
    Type = "Type",
    Variable = "Variable",
    Block = "Block",
}
