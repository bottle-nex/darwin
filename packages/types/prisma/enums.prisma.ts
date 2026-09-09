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

export const IssueStatus = {
    Todo: "Todo",
    Queued: "Queued",
    InProgress: "InProgress",
    AwaitingApproval: "AwaitingApproval",
    InReview: "InReview",
    Done: "Done",
    Failed: "Failed",
    Cancelled: "Cancelled",
    Parked: "Parked",
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export const ExecutionMode = {
    Autonomous: "Autonomous",
    Manual: "Manual",
} as const;
export type ExecutionMode = (typeof ExecutionMode)[keyof typeof ExecutionMode];

export const GithubImportTarget = {
    AgentBoard: "AgentBoard",
    CustomColumn: "CustomColumn",
} as const;
export type GithubImportTarget = (typeof GithubImportTarget)[keyof typeof GithubImportTarget];

export const AgentSessionStatus = {
    Running: "Running",
    Succeeded: "Succeeded",
    Failed: "Failed",
    Aborted: "Aborted",
} as const;
export type AgentSessionStatus = (typeof AgentSessionStatus)[keyof typeof AgentSessionStatus];

export const ActorType = {
    User: "User",
    Agent: "Agent",
    System: "System",
    Github: "Github",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

/** Primary renders in the feed, Secondary hides behind "show details", Audit never renders. */
export const ActivitySurface = {
    Primary: "Primary",
    Secondary: "Secondary",
    Audit: "Audit",
} as const;
export type ActivitySurface = (typeof ActivitySurface)[keyof typeof ActivitySurface];

export const ActivityType = {
    IssueCreated: "IssueCreated",
    IssueReopened: "IssueReopened",
    IssueResolved: "IssueResolved",
    IssueCancelled: "IssueCancelled",
    IssueArchived: "IssueArchived",
    IssueDeleted: "IssueDeleted",

    StatusChanged: "StatusChanged",
    PriorityChanged: "PriorityChanged",
    TitleChanged: "TitleChanged",
    DescriptionChanged: "DescriptionChanged",
    AssigneeAdded: "AssigneeAdded",
    AssigneeRemoved: "AssigneeRemoved",
    LabelAdded: "LabelAdded",
    LabelRemoved: "LabelRemoved",
    DatesChanged: "DatesChanged",
    ColumnChanged: "ColumnChanged",
    SpecializationChanged: "SpecializationChanged",
    HarnessConfigChanged: "HarnessConfigChanged",

    RelationAdded: "RelationAdded",
    RelationRemoved: "RelationRemoved",
    SplitIntoSubIssues: "SplitIntoSubIssues",

    Queued: "Queued",
    Routed: "Routed",
    Reprioritized: "Reprioritized",
    Preempted: "Preempted",
    Starved: "Starved",

    RunStarted: "RunStarted",
    RunCompleted: "RunCompleted",
    AttemptFailed: "AttemptFailed",
    RunAborted: "RunAborted",
    WorkerHandoff: "WorkerHandoff",
    WorkerDied: "WorkerDied",
    HumanTookOver: "HumanTookOver",
    HandedBackToHuman: "HandedBackToHuman",

    BugReproduced: "BugReproduced",
    BugNotReproduced: "BugNotReproduced",
    BuildResult: "BuildResult",
    TestResult: "TestResult",
    AcceptanceChecked: "AcceptanceChecked",

    BranchCreated: "BranchCreated",
    CommitsPushed: "CommitsPushed",
    PrOpened: "PrOpened",
    PrReviewReceived: "PrReviewReceived",
    PrFeedbackAddressed: "PrFeedbackAddressed",
    PrChecksFailed: "PrChecksFailed",
    PrRebased: "PrRebased",
    PrMerged: "PrMerged",
    PrClosed: "PrClosed",
    PrReverted: "PrReverted",

    ExternalMessageSent: "ExternalMessageSent",
    ExternalIssueOpened: "ExternalIssueOpened",
    ExternalDocUpdated: "ExternalDocUpdated",
    OncallPaged: "OncallPaged",

    ScopeRequested: "ScopeRequested",
    ScopeGranted: "ScopeGranted",
    ScopeDenied: "ScopeDenied",
    GuardrailHit: "GuardrailHit",
    SecretAccessed: "SecretAccessed",
    BudgetThresholdCrossed: "BudgetThresholdCrossed",
    BudgetExceeded: "BudgetExceeded",

    AttachmentAdded: "AttachmentAdded",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ProductDiffStatus = {
    Pending: "Pending",
    Generating: "Generating",
    Ready: "Ready",
    Failed: "Failed",
    Stale: "Stale",
    Unsupported: "Unsupported",
} as const;
export type ProductDiffStatus = (typeof ProductDiffStatus)[keyof typeof ProductDiffStatus];

export const NotificationType = {
    IssueAssigned: "IssueAssigned",
    IssueUnassigned: "IssueUnassigned",
    ChatMention: "ChatMention",
    ProjectChatMention: "ProjectChatMention",
    TeamChatMention: "TeamChatMention",
    DescriptionMention: "DescriptionMention",
    IssueStatusChanged: "IssueStatusChanged",
    IssuePriorityChanged: "IssuePriorityChanged",
    IssueMoved: "IssueMoved",
    IssueCommented: "IssueCommented",
    IssueReferenced: "IssueReferenced",
    IssueDeleted: "IssueDeleted",
    InviteAccepted: "InviteAccepted",
    AddedToProject: "AddedToProject",
    AddedToTeam: "AddedToTeam",
    RemovedFromTeam: "RemovedFromTeam",
    RemovedFromOrg: "RemovedFromOrg",
    RoleChanged: "RoleChanged",
    MessageReacted: "MessageReacted",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const PostKind = {
    Blog: "Blog",
    Changelog: "Changelog",
} as const;
export type PostKind = (typeof PostKind)[keyof typeof PostKind];

export const PostStatus = {
    Draft: "Draft",
    Published: "Published",
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const ReleaseChannel = {
    Beta: "Beta",
    Stable: "Stable",
} as const;
export type ReleaseChannel = (typeof ReleaseChannel)[keyof typeof ReleaseChannel];

export const SidebarTheme = {
    TimeOfDay: "TimeOfDay",
    Lilac: "Lilac",
    Slate: "Slate",
    Neutral: "Neutral",
} as const;
export type SidebarTheme = (typeof SidebarTheme)[keyof typeof SidebarTheme];

export const BackgroundLightingColor = {
    Violet: "Violet",
    Matcha: "Matcha",
    Blue: "Blue",
    Amber: "Amber",
    Rose: "Rose",
    Neutral: "Neutral",
} as const;
export type BackgroundLightingColor =
    (typeof BackgroundLightingColor)[keyof typeof BackgroundLightingColor];

export const CodeTheme = {
    Darwin: "Darwin",
    NightOwl: "NightOwl",
    OneDark: "OneDark",
    Dracula: "Dracula",
    Nord: "Nord",
    MaterialOceanic: "MaterialOceanic",
    GruvboxDark: "GruvboxDark",
    VscDarkPlus: "VscDarkPlus",
    A11yDark: "A11yDark",
} as const;
export type CodeTheme = (typeof CodeTheme)[keyof typeof CodeTheme];

export const SwipeTarget = {
    Settings: "Settings",
    Darwin: "Darwin",
    Off: "Off",
} as const;
export type SwipeTarget = (typeof SwipeTarget)[keyof typeof SwipeTarget];

export const DiffView = {
    Unified: "Unified",
    Split: "Split",
} as const;
export type DiffView = (typeof DiffView)[keyof typeof DiffView];

export const ColorScheme = {
    Dark: "Dark",
    Light: "Light",
    System: "System",
} as const;
export type ColorScheme = (typeof ColorScheme)[keyof typeof ColorScheme];

export const DefaultHomeView = {
    AskDarwin: "AskDarwin",
    Inbox: "Inbox",
    Chats: "Chats",
    Kanban: "Kanban",
    Spaces: "Spaces",
    Gantt: "Gantt",
    Tags: "Tags",
    AssignedToMe: "AssignedToMe",
} as const;
export type DefaultHomeView = (typeof DefaultHomeView)[keyof typeof DefaultHomeView];

export const Harness = {
    Claude: "Claude",
    Codex: "Codex",
    OpenCode: "OpenCode",
} as const;
export type Harness = (typeof Harness)[keyof typeof Harness];

export const Effort = {
    Low: "Low",
    Medium: "Medium",
    High: "High",
    XHigh: "XHigh",
    Max: "Max",
} as const;
export type Effort = (typeof Effort)[keyof typeof Effort];
