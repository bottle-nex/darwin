import Mention, { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { QueryClient } from "@tanstack/react-query";
import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";
import { search_issues, search_members, type IssueSuggestion } from "@/lib/referenceSearch";
import type { ProjectMember } from "@/hooks/project/useProjectMembers";
import ReferenceSuggestionList, {
    type ReferenceSuggestionListHandle,
} from "./ReferenceSuggestionList";

export type ReferenceSuggestion =
    | { kind: "member"; id: string; label: string; member: ProjectMember }
    | { kind: "issue"; id: string; label: string; issue: IssueSuggestion };

type ReferenceSuggestionOptions = Omit<
    SuggestionOptions<ReferenceSuggestion, MentionNodeAttrs>,
    "editor"
>;

export const MEMBER_TRIGGER = "@";
export const ISSUE_TRIGGER = "#";

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

export function createReferenceMention(
    queryClient: QueryClient,
    projectId: string,
    portalSelector: string,
) {
    const shared = {
        container: portalSelector,
        allowSpaces: false,
        command: insert_reference,
        render: render_suggestion,
    };

    return Mention.configure({
        HTMLAttributes: { class: "reference-chip" },
        renderText: ({ node }) =>
            `${node.attrs.mentionSuggestionChar ?? MEMBER_TRIGGER}${node.attrs.label}`,
        renderHTML: ({ node }) => [
            "span",
            {
                "data-type": "mention",
                "data-kind":
                    node.attrs.mentionSuggestionChar === ISSUE_TRIGGER ? "issue" : "member",
                class: "reference-chip",
            },
            `${node.attrs.mentionSuggestionChar ?? MEMBER_TRIGGER}${node.attrs.label}`,
        ],
        suggestions: [
            {
                ...shared,
                char: MEMBER_TRIGGER,
                pluginKey: SUGGESTION_KEYS[0],
                items: async ({ query }) => {
                    const members = await search_members(queryClient, projectId, query);
                    return members.map((member) => ({
                        kind: "member" as const,
                        id: member.memberId,
                        label: displayNameOf(member.name, member.email),
                        member,
                    }));
                },
            },
            {
                ...shared,
                char: ISSUE_TRIGGER,
                pluginKey: SUGGESTION_KEYS[1],
                items: async ({ query }) => {
                    const issues = await search_issues(queryClient, projectId, query);
                    return issues.map((issue) => ({
                        kind: "issue" as const,
                        id: issue.id,
                        label: `${issue.number} ${issue.title}`,
                        issue,
                    }));
                },
            },
        ],
    });
}
