import type { QueryClient } from "@tanstack/react-query";
import Mention, { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { parse_reference_token, reference_key } from "@trymatcha/types";

import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { ProjectMember } from "@/hooks/project/useProjectMembers";
import { issueIdentifier } from "@/lib/format";
import { type IssueSuggestion, search_issues, search_members } from "@/lib/referenceSearch";

import ReferenceChip from "./ReferenceChip";
import ReferenceSuggestionList, {
    type ReferenceSuggestionListHandle,
} from "./ReferenceSuggestionList";
import { ISSUE_TRIGGER, kindFor, MEMBER_TRIGGER } from "./referenceTriggers";

export type ReferenceSuggestion =
    | { kind: "member"; id: string; label: string; member: ProjectMember }
    | { kind: "issue"; id: string; label: string; issue: IssueSuggestion };

type ReferenceSuggestionOptions = Omit<
    SuggestionOptions<ReferenceSuggestion, MentionNodeAttrs>,
    "editor"
>;

export { ISSUE_TRIGGER, MEMBER_TRIGGER } from "./referenceTriggers";

export const SUGGESTION_KEYS = [new PluginKey("memberReference"), new PluginKey("issueReference")];

const render_suggestion: ReferenceSuggestionOptions["render"] = () => {
    let component: ReactRenderer<ReferenceSuggestionListHandle>;
    let unmount: (() => void) | undefined;

    return {
        onStart: (props) => {
            component = new ReactRenderer(ReferenceSuggestionList, {
                props,
                editor: props.editor,
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
                    mentionSuggestionChar: item.kind === "issue" ? ISSUE_TRIGGER : MEMBER_TRIGGER,
                },
            },
            { type: "text", text: " " },
        ])
        .run();
};

function referenceToken(char: string, id: string): string {
    return `${char}[${reference_key(kindFor(char), id)}]`;
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

export type ReferenceTrigger = "member" | "issue";

function member_matches(member: ProjectMember, query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
        (member.name?.toLowerCase().includes(needle) ?? false) ||
        member.email.toLowerCase().includes(needle)
    );
}

function to_member_item(member: ProjectMember): ReferenceSuggestion {
    return {
        kind: "member",
        id: member.memberId,
        label: displayNameOf(member.name, member.email),
        member,
    };
}

export function createReferenceMention({
    queryClient,
    projectId,
    projectName,
    container,
    triggers = ["member", "issue"],
    memberUserIds,
}: {
    queryClient: QueryClient;
    projectId: string;
    /** Names the issues a mention suggests. The label is stored in the message. */
    projectName?: string;
    container?: string;
    triggers?: ReferenceTrigger[];
    memberUserIds?: readonly string[];
}) {
    const allowed_member_ids = memberUserIds ? new Set(memberUserIds) : null;
    const allowed_members = (members: ProjectMember[]) =>
        allowed_member_ids
            ? members.filter((member) => allowed_member_ids.has(member.id))
            : members;
    const shared = {
        ...(container ? { container } : { floatingUi: { strategy: "fixed" as const } }),
        allowSpaces: false,
        command: insert_reference,
        render: render_suggestion,
    };

    const member_suggestion = {
        ...shared,
        char: MEMBER_TRIGGER,
        pluginKey: SUGGESTION_KEYS[0],
        items: async ({ query }: { query: string }) => {
            const roster = await search_members(queryClient, projectId, "");
            const narrowed = allowed_members(roster).filter((member) =>
                member_matches(member, query),
            );
            if (narrowed.length || !query.trim()) return narrowed.map(to_member_item);

            const searched = await search_members(queryClient, projectId, query);
            return allowed_members(searched).map(to_member_item);
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
        renderText: ({ node }) => {
            const char = node.attrs.mentionSuggestionChar ?? MEMBER_TRIGGER;
            return node.attrs.id
                ? referenceToken(char, node.attrs.id)
                : `${char}${node.attrs.label ?? ""}`;
        },
        /**
         * The stored text is the shared reference token, so `reference_ids` and
         * `filter_reference_tokens` read an issue description exactly the way
         * they already read a chat message.
         */
        renderHTML: ({ node }) => {
            const char = node.attrs.mentionSuggestionChar ?? MEMBER_TRIGGER;
            const id = node.attrs.id as string | null;
            return [
                "span",
                {
                    "data-type": "mention",
                    "data-kind": kindFor(char),
                    ...(id ? { "data-id": id } : {}),
                    "data-mention-suggestion-char": char,
                    class: "reference-chip",
                },
                id ? referenceToken(char, id) : `${char}${node.attrs.label ?? ""}`,
            ];
        },
        suggestions: triggers.map((trigger) =>
            trigger === "member" ? member_suggestion : issue_suggestion,
        ),
    });
}
