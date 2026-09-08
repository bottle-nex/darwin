"use client";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type { ReferenceKind } from "@trydarwin/types";
import { reference_sigil } from "@trydarwin/types";
import { TeamEntityIcon } from "@trydarwin/ui/icons";

import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { useIssue } from "@/hooks/issues/useIssue";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { issueIdentifier } from "@/lib/format";

/**
 * The chip renders the target's current name, looked up by id, so a rename or a
 * retitle is reflected everywhere the reference appears.
 */
export default function ReferenceChip({ node }: NodeViewProps) {
    const project = useActiveProject();
    const projectId = project?.id;
    const projectName = project?.name;
    const kind = ((node.attrs.kind as ReferenceKind | null) ?? "member") as ReferenceKind;
    const id = node.attrs.id as string | null;

    const { data: issue, isPending: issuePending } = useIssue(
        projectId,
        kind === "issue" ? (id ?? undefined) : undefined,
    );
    const { data: members } = useProjectMembers(kind === "member" ? projectId : undefined);
    const { data: detail } = useGetProject(kind === "team" ? projectId : undefined);

    const member = kind === "member" ? members?.find((row) => row.memberId === id) : undefined;
    const team = kind === "team" ? detail?.teams.find((row) => row.id === id) : undefined;

    const resolved = issue
        ? `${issueIdentifier(projectName, issue.number)} ${issue.title}`
        : member
          ? displayNameOf(member.name, member.email)
          : (team?.name ?? null);

    const pending = kind === "issue" ? issuePending : kind === "team" ? !detail : !members;
    const label = resolved ?? (node.attrs.label as string | null) ?? (pending ? "…" : "unknown");

    return (
        <NodeViewWrapper
            as="span"
            data-type="mention"
            data-kind={kind}
            data-missing={!resolved && !pending ? "true" : undefined}
            className="reference-chip"
        >
            {kind === "team" &&
                (team?.icon ? (
                    <IconPickGlyph
                        pick={team.icon}
                        className="mr-0.5 inline size-3 align-[-1px] text-[11px]"
                    />
                ) : (
                    <TeamEntityIcon className="mr-0.5 inline size-3 align-[-1px]" />
                ))}
            {reference_sigil(kind)}
            {label}
        </NodeViewWrapper>
    );
}
