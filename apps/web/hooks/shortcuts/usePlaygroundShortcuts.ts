import {
    AgentIcon,
    AssigneeGroupIcon,
    ChangeRoleIcon,
    ChatsNavIcon,
    CommandMenuIcon,
    CopyIcon,
    DeleteIcon,
    EditCalendarIcon,
    EditIcon,
    GanttNavIcon,
    HelpIcon,
    IssueEntityIcon,
    KanbanColumnsIcon,
    NotificationsBellIcon,
    OrganizationEntityIcon,
    ProjectEntityIcon,
    RemovedFromOrgIcon,
    RemoveMemberIcon,
    RevokeInviteIcon,
    SettingsIcon,
    SidebarToggleIcon,
    SpaceEntityIcon,
    TagIcon,
    TeamEntityIcon,
} from "@trydarwin/ui/icons";
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
import { useDeleteSpaceStore } from "@/store/space/useDeleteSpaceStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";
import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useRemoveMembersStore } from "@/store/team/useRemoveMembersStore";
import { useRevokeInvitesStore } from "@/store/team/useRevokeInvitesStore";
import {
    type CommandAction,
    type CommandContext,
    type CommandEntry,
    CommandKind,
    type CommandPage,
} from "@/types/command.type";
import { splitMemberSelection } from "@/types/team";

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

function spaceTargets(context: CommandContext): string[] {
    const selected = useSpaceSelectionStore.getState().ids;
    if (selected.length) return selected;
    return context.spaceId ? [context.spaceId] : [];
}

function onSpace(context: CommandContext): boolean {
    return spaceTargets(context).length > 0;
}

function onOneSpace(context: CommandContext): boolean {
    return spaceTargets(context).length === 1;
}

function memberSelection(): { memberUserIds: string[]; invitationIds: string[] } {
    return splitMemberSelection(useMemberSelectionStore.getState().ids);
}

function onMembers(context: CommandContext): boolean {
    if (!context.teamId) return false;
    const { memberUserIds, invitationIds } = memberSelection();
    return memberUserIds.length > 0 && invitationIds.length === 0;
}

function onInvites(context: CommandContext): boolean {
    if (!context.teamId) return false;
    const { memberUserIds, invitationIds } = memberSelection();
    return invitationIds.length > 0 && memberUserIds.length === 0;
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
        opensPage: true,
        run: openMenuPage("status"),
    },
    "e p": {
        kind: CommandKind.Issue,
        label: "Set priority",
        icon: PRIORITY_OPTIONS[0].icon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("priority"),
    },
    "e a": {
        kind: CommandKind.Issue,
        label: "Assign to",
        icon: AssigneeGroupIcon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("assignees"),
    },
    "e t": {
        kind: CommandKind.Issue,
        label: "Edit tags",
        icon: TagIcon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("tags"),
    },
    "e d": {
        kind: CommandKind.Issue,
        label: "Set dates",
        icon: EditCalendarIcon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("dates"),
    },
    "e m": {
        kind: CommandKind.Issue,
        label: "Move to column",
        icon: KanbanColumnsIcon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("move"),
    },
    "e c": {
        kind: CommandKind.Issue,
        label: "Copy from issue",
        icon: CopyIcon,
        isAvailable: onIssue,
        opensPage: true,
        run: openMenuPage("copy"),
    },
    "g d": {
        kind: CommandKind.Space,
        label: "Set dates",
        icon: EditCalendarIcon,
        isAvailable: onSpace,
        opensPage: true,
        run: openMenuPage("space-dates"),
    },
    "g e": {
        kind: CommandKind.Space,
        label: "Edit space",
        icon: EditIcon,
        isAvailable: onOneSpace,
        run: () => {
            const [spaceId] = spaceTargets(commandContext());
            if (spaceId) useSpaceFormStore.getState().openEdit(spaceId);
        },
    },
    "m r": {
        kind: CommandKind.Member,
        label: "Set team role",
        icon: ChangeRoleIcon,
        isAvailable: onMembers,
        opensPage: true,
        run: openMenuPage("member-team-role"),
    },
    "m p": {
        kind: CommandKind.Member,
        label: "Set project role",
        icon: ChangeRoleIcon,
        isAvailable: onMembers,
        opensPage: true,
        run: openMenuPage("member-project-role"),
    },
    "o k": {
        kind: CommandKind.Open,
        label: "Open Agent board",
        icon: AgentIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Agent),
    },
    "o p": {
        kind: CommandKind.Open,
        label: "Open Spaces",
        icon: SpaceEntityIcon,
        isAvailable: inProject,
        run: () => openTab(PlaygroundTab.Spaces),
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
    "n s": {
        kind: CommandKind.New,
        label: "New Space",
        icon: SpaceEntityIcon,
        isAvailable: inProject,
        run: () => useSpaceFormStore.getState().openCreate(),
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
    "d s": {
        kind: CommandKind.Delete,
        label: "Delete Space",
        icon: DeleteIcon,
        destructive: true,
        isAvailable: onSpace,
        run: () => {
            const targets = spaceTargets(commandContext());
            if (targets.length) useDeleteSpaceStore.getState().requestDelete(...targets);
        },
    },
    "d u": {
        kind: CommandKind.Delete,
        label: "Remove from team",
        icon: RemoveMemberIcon,
        destructive: true,
        isAvailable: onMembers,
        run: () => {
            const { memberUserIds } = memberSelection();
            if (memberUserIds.length) {
                useRemoveMembersStore.getState().requestRemove({
                    userIds: memberUserIds,
                    scope: "team",
                });
            }
        },
    },
    "d o": {
        kind: CommandKind.Delete,
        label: "Remove from organization",
        icon: RemovedFromOrgIcon,
        destructive: true,
        isAvailable: onMembers,
        run: () => {
            const { memberUserIds } = memberSelection();
            if (memberUserIds.length) {
                useRemoveMembersStore.getState().requestRemove({
                    userIds: memberUserIds,
                    scope: "org",
                });
            }
        },
    },
    "d v": {
        kind: CommandKind.Delete,
        label: "Revoke invite",
        icon: RevokeInviteIcon,
        destructive: true,
        isAvailable: onInvites,
        run: () => useRevokeInvitesStore.getState().requestRevoke(memberSelection().invitationIds),
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
