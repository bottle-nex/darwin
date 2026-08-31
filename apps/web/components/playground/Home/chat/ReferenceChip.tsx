"use client";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";
import { useIssue } from "@/hooks/issues/useIssue";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { issueIdentifier } from "@/lib/format";

import { ISSUE_TRIGGER, kindFor, MEMBER_TRIGGER } from "./referenceTriggers";

/**
 * The chip renders the target's current name, looked up by id, so a rename or a
 * retitle is reflected everywhere the reference appears.
 */
export default function ReferenceChip({ node }: NodeViewProps) {
    const project = useActiveProject();
    const projectId = project?.id;
    const projectName = project?.name;
    const char = (node.attrs.mentionSuggestionChar as string) ?? MEMBER_TRIGGER;
    const isIssue = char === ISSUE_TRIGGER;
    const id = node.attrs.id as string | null;

    const { data: issue, isPending: issuePending } = useIssue(
        projectId,
        isIssue ? (id ?? undefined) : undefined,
    );
    const { data: members } = useProjectMembers(isIssue ? undefined : projectId);

    const member = isIssue ? undefined : members?.find((row) => row.memberId === id);

    const resolved = issue
        ? `${issueIdentifier(projectName, issue.number)} ${issue.title}`
        : member
          ? displayNameOf(member.name, member.email)
          : null;

    const pending = isIssue ? issuePending : !members;
    const label = resolved ?? (node.attrs.label as string | null) ?? (pending ? "…" : "unknown");

    return (
        <NodeViewWrapper
            as="span"
            data-type="mention"
            data-kind={kindFor(char)}
            data-missing={!resolved && !pending ? "true" : undefined}
            className="reference-chip"
        >
            {char}
            {label}
        </NodeViewWrapper>
    );
}
