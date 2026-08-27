import {
    AssigneeGroupIcon,
    CalendarIcon,
    ChatsNavIcon,
    CommandMenuIcon,
    CopyIcon,
    DeleteIcon,
    GanttNavIcon,
    HelpIcon,
    IssueEntityIcon,
    KanbanColumnsIcon,
    NotificationsBellIcon,
    OrganizationEntityIcon,
    ProjectEntityIcon,
    SettingsIcon,
    SidebarToggleIcon,
    TagIcon,
    TeamEntityIcon,
} from "@trymatcha/ui/icons";
import { useEffect, useRef } from "react";

import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { commandContext } from "@/store/command/useCommandContextStore";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useShortcutSheetStore } from "@/store/playground/useShortcutSheetStore";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import {
    type CommandAction,
    type CommandContext,
    type CommandEntry,
    CommandKind,
    type CommandPage,
} from "@/types/command.type";

function openTab(tab: PlaygroundTab) {
    usePlaygroundNavStore.getState().setTab(tab);
}

function issueTargets(context: CommandContext): string[] {
    const selected = useIssueSelectionStore.getState().ids;
    if (selected.length) return selected;
    return context.issueId ? [context.issueId] : [];
}

function onIssue(context: CommandContext): boolean {
    return issueTargets(context).length > 0;
}

function openMenuPage(page: CommandPage) {
    return () => useCommandMenuStore.getState().openAt(page);
}

function inProject(context: CommandContext): boolean {
    return Boolean(context.projectId);
}

function inOrg(context: CommandContext): boolean {
    return Boolean(context.orgSlug);
}

function openNewTeam() {
    const { projectId } = commandContext();
    if (!projectId) return;
    useNewTeamStore.getState().setTargetProjectId(projectId);
    useNewTeamStore.getState().setOpen(true);
}

export const COMBINATIONS: Record<string, CommandAction> = {
    "e s": {
        kind: CommandKind.Issue,
        label: "Change status",
        icon: KanbanBoard.COLUMNS[0].icon,
        isAvailable: onIssue,
        run: openMenuPage("status"),
    },
    "e p": {
        kind: CommandKind.Issue,
        label: "Set priority",
        icon: PRIORITY_OPTIONS[0].icon,
        isAvailable: onIssue,
        run: openMenuPage("priority"),
    },
    "e a": {
        kind: CommandKind.Issue,
        label: "Assign to",
        icon: AssigneeGroupIcon,
        isAvailable: onIssue,
        run: openMenuPage("assignees"),
    },
    "e t": {
        kind: CommandKind.Issue,
        label: "Edit tags",
        icon: TagIcon,
        isAvailable: onIssue,
        run: openMenuPage("tags"),
    },
    "e d": {
        kind: CommandKind.Issue,
        label: "Set dates",
        icon: CalendarIcon,
        isAvailable: onIssue,
        run: openMenuPage("dates"),
    },
    "e m": {
        kind: CommandKind.Issue,
        label: "Move to column",
        icon: KanbanColumnsIcon,
        isAvailable: onIssue,
        run: openMenuPage("move"),
    },
    "e c": {
        kind: CommandKind.Issue,
        label: "Copy from issue",
        icon: CopyIcon,
        isAvailable: onIssue,
        run: openMenuPage("copy"),
    },
    "o k": {
        kind: CommandKind.Open,
        label: "Open Kanban",
        icon: KanbanColumnsIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Kanban),
    },
    "o g": {
        kind: CommandKind.Open,
        label: "Open Gantt",
        icon: GanttNavIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Gantt),
    },
    "o t": {
        kind: CommandKind.Open,
        label: "Open Tags",
        icon: TagIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Tags),
    },
    "o c": {
        kind: CommandKind.Open,
        label: "Open Chats",
        icon: ChatsNavIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Chats),
    },
    "o s": {
        kind: CommandKind.Open,
        label: "Open Settings",
        icon: SettingsIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.SettingsAppearance),
    },
    "o n": {
        kind: CommandKind.Open,
        label: "Open Notifications",
        icon: NotificationsBellIcon,
        isAvailable: inProject,
        run: () => useNotificationsPanelStore.getState().toggle(),
    },
    "n i": {
        kind: CommandKind.New,
        label: "New Issue",
        icon: IssueEntityIcon,
        isAvailable: inProject,
        run: () => useCreateIssueStore.getState().open({ board: "llm" }),
    },
    "n p": {
        kind: CommandKind.New,
        label: "New Project",
        icon: ProjectEntityIcon,
        isAvailable: inOrg,
        run: () => useNewProjectStore.getState().setOpen(true),
    },
    "n t": {
        kind: CommandKind.New,
        label: "New Tag",
        icon: TagIcon,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("new-tag"),
    },
    "n m": {
        kind: CommandKind.New,
        label: "New Team",
        icon: TeamEntityIcon,
        isAvailable: inProject,
        run: openNewTeam,
    },
    "n o": {
        kind: CommandKind.New,
        label: "New Organization",
        icon: OrganizationEntityIcon,
        run: () => useCommandActionStore.getState().start("new-organization"),
    },
    "s o": {
        kind: CommandKind.Switch,
        label: "Switch Organization",
        icon: OrganizationEntityIcon,
        run: () => useCommandActionStore.getState().start("switch-organization"),
    },
    "s p": {
        kind: CommandKind.Switch,
        label: "Switch Project",
        icon: ProjectEntityIcon,
        isAvailable: inOrg,
        run: () => useCommandActionStore.getState().start("switch-project"),
    },
    "s m": {
        kind: CommandKind.Switch,
        label: "Switch Team",
        icon: TeamEntityIcon,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("switch-team"),
    },
    "d t": {
        kind: CommandKind.Delete,
        label: "Delete Tag",
        icon: TagIcon,
        destructive: true,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("delete-tag"),
    },
    "d m": {
        kind: CommandKind.Delete,
        label: "Delete Team",
        icon: TeamEntityIcon,
        destructive: true,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("delete-team"),
    },
    "d i": {
        kind: CommandKind.Delete,
        label: "Delete Issue",
        icon: DeleteIcon,
        destructive: true,
        isAvailable: onIssue,
        run: () => {
            const targets = issueTargets(commandContext());
            if (targets.length) useDeleteIssueStore.getState().requestDelete(targets);
        },
    },
    "d p": {
        kind: CommandKind.Delete,
        label: "Delete Project",
        icon: ProjectEntityIcon,
        destructive: true,
        isAvailable: inOrg,
        run: () => useCommandActionStore.getState().start("delete-project"),
    },
    "mod+k": {
        kind: CommandKind.Workspace,
        label: "Toggle command menu",
        icon: CommandMenuIcon,
        run: () => useCommandMenuStore.getState().toggle(),
    },
    "mod+/": {
        kind: CommandKind.Workspace,
        label: "Toggle shortcuts",
        icon: HelpIcon,
        run: () => useShortcutSheetStore.getState().toggle(),
    },
    "[": {
        kind: CommandKind.Workspace,
        label: "Toggle Sidebar",
        icon: SidebarToggleIcon,
        run: () => useSidebarWidthStore.getState().toggle(),
    },
    "]": {
        kind: CommandKind.Workspace,
        label: "Toggle Notifications",
        icon: NotificationsBellIcon,
        run: () => useNotificationsPanelStore.getState().toggle(),
    },
};

export const COMMAND_ENTRIES: CommandEntry[] = Object.entries(COMBINATIONS).map(
    ([combo, action]) => ({ combo, ...action }),
);

export function isCommandAvailable(action: CommandAction, context: CommandContext): boolean {
    return action.isAvailable ? action.isAvailable(context) : true;
}

export function comboToKeys(combo: string): string[] {
    return combo
        .split(" ")
        .flatMap((token) => (token.startsWith("mod+") ? ["⌘", token.slice(4)] : [token]));
}

const SEQUENCE_TIMEOUT_MS = 800;

export function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function matchKeys(keys: string[]): "matched" | "pending" | "none" {
    const sequence = keys.join(" ");
    const combination = COMBINATIONS[sequence];
    if (combination) {
        if (!isCommandAvailable(combination, commandContext())) return "none";
        combination.run();
        return "matched";
    }
    const isPrefix = Object.keys(COMBINATIONS).some((combo) => combo.startsWith(`${sequence} `));
    return isPrefix ? "pending" : "none";
}

export default function usePlaygroundShortcuts() {
    const pendingKeysRef = useRef<string[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function reset() {
            pendingKeysRef.current = [];
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        function startResetTimer() {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(reset, SEQUENCE_TIMEOUT_MS);
        }

        function handleKeys(keys: string[]): boolean {
            const outcome = matchKeys(keys);
            if (outcome === "matched") {
                reset();
                return true;
            }
            if (outcome === "pending") {
                pendingKeysRef.current = keys;
                startResetTimer();
                return true;
            }
            return false;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.altKey) return;
            const withModifier = event.metaKey || event.ctrlKey;
            if (!withModifier && isTyping(event.target)) return;

            const key = event.key.toLowerCase();
            if (key.length !== 1) return;

            const token = withModifier ? `mod+${key}` : key;

            if (handleKeys([...pendingKeysRef.current, token])) {
                event.preventDefault();
                return;
            }
            reset();
            if (handleKeys([token])) event.preventDefault();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            reset();
        };
    }, []);
}
