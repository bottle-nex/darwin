import type { QueryClient } from "@tanstack/react-query";
import Mention, { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
    parse_reference_token,
    reference_sigil,
    reference_token,
    type ReferenceKind,
} from "@trymatcha/types";

import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { ProjectMember } from "@/hooks/project/useProjectMembers";
import { issueIdentifier } from "@/lib/format";
import {
    type IssueSuggestion,
    search_issues,
    search_members,
    search_teams,
    team_member_user_ids,
} from "@/lib/referenceSearch";
import type { ProjectTeam } from "@/types/project";

import ReferenceChip from "./ReferenceChip";
import ReferenceSuggestionList, {
    type ReferenceSuggestionListHandle,
} from "./ReferenceSuggestionList";
import { ISSUE_TRIGGER, MEMBER_TRIGGER } from "./referenceTriggers";

export type ReferenceSuggestion =
    | { kind: "member"; id: string; label: string; member: ProjectMember }
    | { kind: "issue"; id: string; label: string; issue: IssueSuggestion }
    | { kind: "team"; id: string; label: string; team: ProjectTeam };

type ReferenceSuggestionOptions = Omit<
    SuggestionOptions<ReferenceSuggestion, MentionNodeAttrs>,
    "editor"
>;

export { ISSUE_TRIGGER, MEMBER_TRIGGER } from "./referenceTriggers";

export const SUGGESTION_KEYS = [new PluginKey("mentionReference"), new PluginKey("issueReference")];

const render_suggestion: ReferenceSuggestionOptions["render"] = () => {
    let component: ReactRenderer<ReferenceSuggestionListHandle>;
    let unmount: (() => void) | undefined;

    return {
        onStart: (props) => {
            component = new ReactRenderer(ReferenceSuggestionList, {
                props,
                editor: props.editor,
                className: "z-[100]",
            });
            unmount = props.mount(component.element as HTMLElement);
        },
        onUpdate: (props) => {
            component.updateProps(props);
        },
        onKeyDown: (props) => {
            if (props.event.key === "Escape") {
                unmount?.();
                return true;
            }
            return component.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
            unmount?.();
            component.destroy();
        },
    };
};

const insert_reference: ReferenceSuggestionOptions["command"] = ({ editor, range, props }) => {
    const item = props as unknown as ReferenceSuggestion;
    editor
        .chain()
        .focus()
        .insertContentAt(range, [
            {
                type: "mention",
                attrs: {
                    id: item.id,
                    label: item.label,
                    kind: item.kind,
                    mentionSuggestionChar: reference_sigil(item.kind),
                },
            },
            { type: "text", text: " " },
        ])
        .run();
};

function node_kind(attrs: Record<string, unknown>): ReferenceKind {
    return (attrs.kind as ReferenceKind | null) ?? "member";
}

function node_text(attrs: Record<string, unknown>): string {
    const kind = node_kind(attrs);
    const id = attrs.id as string | null;
    return id ? reference_token(kind, id) : `${reference_sigil(kind)}${attrs.label ?? ""}`;
}

/**
 * The id is the only thing stored. Labels are resolved live by the node view, so
 * a renamed member or retitled issue never leaves a stale chip behind.
 */
const ReferenceMentionNode = Mention.extend({
    addAttributes() {
        const parent = (this.parent?.() ?? {}) as Record<string, Record<string, unknown>>;
        return {
            ...parent,
            id: {
                ...parent.id,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-id") ??
                    parse_reference_token(element.textContent ?? "")?.id ??
                    null,
            },
            label: {
                ...parent.label,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-label") ??
                    (parse_reference_token(element.textContent ?? "")
                        ? null
                        : (element.textContent?.replace(/^[@#]/, "") ?? null)),
            },
            kind: {
                default: "member",
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-kind") ??
                    parse_reference_token(element.textContent ?? "")?.kind ??
                    (element.textContent?.startsWith(ISSUE_TRIGGER) ? "issue" : "member"),
                renderHTML: () => ({}),
            },
            mentionSuggestionChar: {
                ...parent.mentionSuggestionChar,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-mention-suggestion-char") ??
                    (element.textContent?.startsWith(ISSUE_TRIGGER)
                        ? ISSUE_TRIGGER
                        : MEMBER_TRIGGER),
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ReferenceChip);
    },
});

function matches(text: string | null | undefined, needle: string): boolean {
    return text?.toLowerCase().includes(needle) ?? false;
}

function member_matches(member: ProjectMember, needle: string): boolean {
    return matches(member.name, needle) || matches(member.email, needle);
}

function to_member_item(member: ProjectMember): ReferenceSuggestion {
    return {
        kind: "member",
        id: member.memberId,
        label: displayNameOf(member.name, member.email),
        member,
    };
}

function to_team_item(team: ProjectTeam): ReferenceSuggestion {
    return { kind: "team", id: team.id, label: team.name, team };
}

export function createReferenceMention({
    queryClient,
    projectId,
    projectName,
    container,
    teamId,
}: {
    queryClient: QueryClient;
    projectId: string;
    /** Names the issues a mention suggests. The label is stored in the message. */
    projectName?: string;
    container?: string;
    teamId?: string;
}) {
    const shared = {
        ...(container ? { container } : { floatingUi: { strategy: "fixed" as const } }),
        allowSpaces: false,
        command: insert_reference,
        render: render_suggestion,
    };

    async function taggable_members(query: string): Promise<ProjectMember[]> {
        const needle = query.trim().toLowerCase();
        const allowed = teamId ? new Set(await team_member_user_ids(queryClient, teamId)) : null;
        const narrow = (members: ProjectMember[]) =>
            allowed ? members.filter((member) => allowed.has(member.id)) : members;

        const roster = narrow(await search_members(queryClient, projectId, "")).filter((member) =>
            needle ? member_matches(member, needle) : true,
        );
        if (roster.length || !needle) return roster;

        return narrow(await search_members(queryClient, projectId, query));
    }

    async function taggable_teams(query: string): Promise<ProjectTeam[]> {
        const needle = query.trim().toLowerCase();
        const teams = await search_teams(queryClient, projectId);
        return teams.filter(
            (team) =>
                (teamId ? team.id === teamId : true) &&
                (needle ? matches(team.name, needle) : true),
        );
    }

    const mention_suggestion = {
        ...shared,
        char: MEMBER_TRIGGER,
        pluginKey: SUGGESTION_KEYS[0],
        items: async ({ query }: { query: string }) => {
            const [teams, members] = await Promise.all([
                taggable_teams(query),
                taggable_members(query),
            ]);
            return [...teams.map(to_team_item), ...members.map(to_member_item)];
        },
    };

    const issue_suggestion = {
        ...shared,
        char: ISSUE_TRIGGER,
        pluginKey: SUGGESTION_KEYS[1],
        items: async ({ query }: { query: string }) => {
            const issues = await search_issues(queryClient, projectId, query);
            return issues.map((issue) => ({
                kind: "issue" as const,
                id: issue.id,
                label: `${issueIdentifier(projectName, issue.number)} ${issue.title}`,
                issue,
            }));
        },
    };

    return ReferenceMentionNode.configure({
        HTMLAttributes: { class: "reference-chip" },
        renderText: ({ node }) => node_text(node.attrs),
        /**
         * The stored text is the shared reference token, so `reference_ids` and
         * `filter_reference_tokens` read an issue description exactly the way
         * they already read a chat message.
         */
        renderHTML: ({ node }) => {
            const id = node.attrs.id as string | null;
            return [
                "span",
                {
                    "data-type": "mention",
                    "data-kind": node_kind(node.attrs),
                    ...(id ? { "data-id": id } : {}),
                    "data-mention-suggestion-char": reference_sigil(node_kind(node.attrs)),
                    class: "reference-chip",
                },
                node_text(node.attrs),
            ];
        },
        suggestions: [mention_suggestion, issue_suggestion],
    });
}
