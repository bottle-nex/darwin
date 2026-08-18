import { useEffect, useRef } from "react";
import {
    HiMiniCubeTransparent,
    HiOutlineBell,
    HiOutlineBriefcase,
    HiOutlineCheckCircle,
    HiOutlineCog6Tooth,
    HiOutlineCommandLine,
    HiOutlineFolder,
    HiOutlineQuestionMarkCircle,
    HiOutlineRectangleStack,
    HiOutlineTag,
    HiOutlineUserGroup,
} from "react-icons/hi2";
import { HiMenuAlt2, HiOutlineAnnotation } from "react-icons/hi";
import { LuCalendar, LuColumns3, LuCopy, LuTag, LuTrash2, LuUsers } from "react-icons/lu";
import { PiColumnsLight } from "react-icons/pi";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { TbLayoutSidebarFilled } from "react-icons/tb";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useShortcutSheetStore } from "@/store/playground/useShortcutSheetStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { useIssueStore } from "@/store/issues/useIssueStore";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { commandContext } from "@/store/command/useCommandContextStore";
import {
    CommandKind,
    type CommandAction,
    type CommandContext,
    type CommandEntry,
    type CommandPage,
} from "@/types/command.type";

function openTab(tab: PlaygroundTab) {
    usePlaygroundNavStore.getState().setTab(tab);
}

function onIssue(context: CommandContext): boolean {
    return Boolean(context.issueId);
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
        icon: LuUsers,
        isAvailable: onIssue,
        run: openMenuPage("assignees"),
    },
    "e t": {
        kind: CommandKind.Issue,
        label: "Edit tags",
        icon: LuTag,
        isAvailable: onIssue,
        run: openMenuPage("tags"),
    },
    "e d": {
        kind: CommandKind.Issue,
        label: "Set dates",
        icon: LuCalendar,
        isAvailable: onIssue,
        run: openMenuPage("dates"),
    },
    "e m": {
        kind: CommandKind.Issue,
        label: "Move to column",
        icon: LuColumns3,
        isAvailable: onIssue,
        run: openMenuPage("move"),
    },
    "e c": {
        kind: CommandKind.Issue,
        label: "Copy from issue",
        icon: LuCopy,
        isAvailable: onIssue,
        run: openMenuPage("copy"),
    },
    "o o": {
        kind: CommandKind.Open,
        label: "Open Overview",
        icon: HiMiniCubeTransparent,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Overview),
    },
    "o k": {
        kind: CommandKind.Open,
        label: "Open Kanban",
        icon: PiColumnsLight,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Kanban),
    },
    "o g": {
        kind: CommandKind.Open,
        label: "Open Gantt",
        icon: HiMenuAlt2,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Gantt),
    },
    "o t": {
        kind: CommandKind.Open,
        label: "Open Tags",
        icon: HiOutlineTag,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Tags),
    },
    "o c": {
        kind: CommandKind.Open,
        label: "Open Chats",
        icon: HiOutlineAnnotation,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Chats),
    },
    "o r": {
        kind: CommandKind.Open,
        label: "Open Reviews",
        icon: HiOutlineCheckCircle,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Reviews),
    },
    "o s": {
        kind: CommandKind.Open,
        label: "Open Settings",
        icon: HiOutlineCog6Tooth,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.SettingsProject),
    },
    "o n": {
        kind: CommandKind.Open,
        label: "Open Notifications",
        icon: HiOutlineBell,
        isAvailable: inProject,
        run: () => useNotificationsPanelStore.getState().toggle(),
    },
    "n i": {
        kind: CommandKind.New,
        label: "New Issue",
        icon: HiOutlineRectangleStack,
        isAvailable: inProject,
        run: () => useIssueStore.getState().openCreate({ board: "llm" }),
    },
    "n p": {
        kind: CommandKind.New,
        label: "New Project",
        icon: HiOutlineFolder,
        isAvailable: inOrg,
        run: () => useNewProjectStore.getState().setOpen(true),
    },
    "n t": {
        kind: CommandKind.New,
        label: "New Tag",
        icon: HiOutlineTag,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("new-tag"),
    },
    "n m": {
        kind: CommandKind.New,
        label: "New Team",
        icon: HiOutlineUserGroup,
        isAvailable: inProject,
        run: openNewTeam,
    },
    "n w": {
        kind: CommandKind.New,
        label: "New Workspace",
        icon: HiOutlineBriefcase,
        run: () => useCommandActionStore.getState().start("new-organization"),
    },
    "s o": {
        kind: CommandKind.Switch,
        label: "Switch Organization",
        icon: HiOutlineBriefcase,
        run: () => useCommandActionStore.getState().start("switch-organization"),
    },
    "s p": {
        kind: CommandKind.Switch,
        label: "Switch Project",
        icon: HiOutlineFolder,
        isAvailable: inOrg,
        run: () => useCommandActionStore.getState().start("switch-project"),
    },
    "s m": {
        kind: CommandKind.Switch,
        label: "Switch Team",
        icon: HiOutlineUserGroup,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("switch-team"),
    },
    "d t": {
        kind: CommandKind.Delete,
        label: "Delete Tag",
        icon: HiOutlineTag,
        destructive: true,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("delete-tag"),
    },
    "d m": {
        kind: CommandKind.Delete,
        label: "Delete Team",
        icon: HiOutlineUserGroup,
        destructive: true,
        isAvailable: inProject,
        run: () => useCommandActionStore.getState().start("delete-team"),
    },
    "d i": {
        kind: CommandKind.Delete,
        label: "Delete Issue",
        icon: LuTrash2,
        destructive: true,
        isAvailable: onIssue,
        run: () => {
            const { issueId } = commandContext();
            if (issueId) useDeleteIssueStore.getState().requestDelete(issueId);
        },
    },
    "d p": {
        kind: CommandKind.Delete,
        label: "Delete Project",
        icon: HiOutlineFolder,
        destructive: true,
        isAvailable: inOrg,
        run: () => useCommandActionStore.getState().start("delete-project"),
    },
    "mod+k": {
        kind: CommandKind.Workspace,
        label: "Toggle command menu",
        icon: HiOutlineCommandLine,
        run: () => useCommandMenuStore.getState().toggle(),
    },
    "mod+/": {
        kind: CommandKind.Workspace,
        label: "Toggle shortcuts",
        icon: HiOutlineQuestionMarkCircle,
        run: () => useShortcutSheetStore.getState().toggle(),
    },
    "[": {
        kind: CommandKind.Workspace,
        label: "Toggle Sidebar",
        icon: TbLayoutSidebarFilled,
        run: () => useSidebarWidthStore.getState().toggle(),
    },
    "]": {
        kind: CommandKind.Workspace,
        label: "Toggle Notifications",
        icon: HiOutlineBell,
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
