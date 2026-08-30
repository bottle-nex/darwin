import type { IconType } from "@trymatcha/ui/icons";

export enum CommandKind {
    Issue = "Issue",
    Space = "Space",
    Workspace = "Workspace",
    Open = "Open",
    New = "New",
    Switch = "Switch",
    Delete = "Delete",
}

export const COMMAND_KIND_ORDER: CommandKind[] = [
    CommandKind.Issue,
    CommandKind.Space,
    CommandKind.Open,
    CommandKind.New,
    CommandKind.Switch,
    CommandKind.Delete,
    CommandKind.Workspace,
];

export interface CommandContext {
    orgSlug: string | null;
    projectId: string | null;
    issueId: string | null;
    spaceId: string | null;
}

export type IssueCommandPage =
    "status" | "priority" | "assignees" | "tags" | "dates" | "move" | "copy";

/** Prefixed so the menu can tell whose page it is without a second lookup. */
export type SpaceCommandPage = "space-dates";

export type CommandPage = IssueCommandPage | SpaceCommandPage;

export function isSpaceCommandPage(page: CommandPage): page is SpaceCommandPage {
    return page.startsWith("space-");
}

export interface CommandAction {
    kind: CommandKind;
    label: string;
    icon: IconType;
    run: () => void;
    isAvailable?: (context: CommandContext) => boolean;
    destructive?: boolean;
    /** Opens a sub-page rather than acting, so the dialog stays open when it runs. */
    opensPage?: boolean;
}

export type CommandEntry = CommandAction & { combo: string };
