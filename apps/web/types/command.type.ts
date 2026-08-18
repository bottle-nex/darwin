import type { IconType } from "react-icons";

export enum CommandKind {
    Issue = "Issue",
    Workspace = "Workspace",
    Open = "Open",
    New = "New",
    Switch = "Switch",
    Delete = "Delete",
}

export const COMMAND_KIND_ORDER: CommandKind[] = [
    CommandKind.Issue,
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
}

export type CommandPage = "status" | "priority" | "assignees" | "tags" | "dates" | "move" | "copy";

export interface CommandAction {
    kind: CommandKind;
    label: string;
    icon: IconType;
    run: () => void;
    isAvailable?: (context: CommandContext) => boolean;
    destructive?: boolean;
}

export type CommandEntry = CommandAction & { combo: string };
