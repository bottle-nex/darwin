"use client";
import { DARWIN_LIST_PREVIEW, type DarwinIssueCard, type DarwinResource } from "@trydarwin/types";
import { SpaceEntityIcon } from "@trydarwin/ui/icons";

import PlaygroundAvatar, {
    displayNameOf,
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import ProjectRoleTicker from "@/components/playground/Team/TeamView/ProjectRoleTicker";
import Pill from "@/components/ui/Pill";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";

import { DarwinCard, DarwinReveal } from "./DarwinCardShell";
import DarwinIssueRow from "./DarwinIssueRow";

/**
 * Draws whatever a step produced.
 *
 * One dispatch on `kind`, then a component per shape — the same arrangement the command palette
 * uses for its mixed search results, because a shared row that bent to fit six resource types
 * would fit none of them.
 */
export default function DarwinResourceBlock({ resource }: { resource: DarwinResource }) {
    if (resource.kind === "issues") return <IssueList resource={resource} />;
    if (resource.kind === "issue") return <IssueDetail resource={resource} />;
    if (resource.kind === "project") return <ProjectCard resource={resource} />;
    if (resource.kind === "board_item") return <BoardItem resource={resource} />;
    if (resource.kind === "members") return <MemberList resource={resource} />;
    if (resource.kind === "comment") return <CommentCard resource={resource} />;
    return <BulkResult resource={resource} />;
}

function countLabel(count: number, noun: string) {
    return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

const showMore = (hidden: number) => `Show ${hidden} more`;

function IssueList({ resource }: { resource: Extract<DarwinResource, { kind: "issues" }> }) {
    return (
        <DarwinCard
            title={countLabel(resource.total, "issue")}
            trailing={
                resource.hasMore ? (
                    <span className="text-[11px] text-neutral-600">
                        showing {resource.items.length}
                    </span>
                ) : null
            }
        >
            <div className="px-1 pb-1">
                <DarwinReveal preview={DARWIN_LIST_PREVIEW} label={showMore}>
                    {resource.items.map((issue) => (
                        <DarwinIssueRow key={issue.id} issue={issue} />
                    ))}
                </DarwinReveal>
            </div>
        </DarwinCard>
    );
}

function IssueDetail({ resource }: { resource: Extract<DarwinResource, { kind: "issue" }> }) {
    const { item, description, comments } = resource;

    return (
        <DarwinCard>
            <div className="px-1 pt-1">
                <DarwinIssueRow issue={item} />
            </div>

            {description && (
                <p className="px-3 pb-2 text-[12.5px] leading-relaxed text-neutral-400">
                    {description}
                </p>
            )}

            {comments.length > 0 && (
                <div className="border-t border-overlay/6 px-3 py-2">
                    <ul className="flex flex-col gap-2">
                        {comments.map((comment, index) => (
                            <li key={`${comment.at}-${index}`} className="flex gap-2">
                                <PlaygroundAvatar
                                    letter={comment.by.charAt(0).toUpperCase()}
                                    tone={toneFor(comment.by)}
                                    size="sm"
                                    className="mt-0.5 shrink-0 rounded-full"
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-neutral-500">
                                        {comment.by} · {comment.at}
                                    </p>
                                    <p className="text-[12.5px] leading-relaxed text-neutral-300">
                                        {comment.text}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </DarwinCard>
    );
}

function ProjectCard({ resource }: { resource: Extract<DarwinResource, { kind: "project" }> }) {
    const openCount = Object.entries(resource.totals)
        .filter(([status]) => status !== "Done" && status !== "Cancelled")
        .reduce((sum, [, count]) => sum + count, 0);

    return (
        <DarwinCard
            title={resource.name}
            trailing={
                <span className="text-[11px] text-neutral-600">
                    {countLabel(openCount, "issue")} open
                </span>
            }
        >
            <div className="flex flex-col gap-3 px-3 pt-1 pb-3">
                {resource.summary && (
                    <p className="text-[12.5px] leading-relaxed text-neutral-400">
                        {resource.summary}
                    </p>
                )}

                {resource.repo && (
                    <Pill tone="muted" className="w-fit font-mono text-[11px]">
                        {resource.repo}
                    </Pill>
                )}

                {resource.boards.length > 0 && (
                    <Facet label="Boards">
                        {resource.boards.map((board) => (
                            <Pill key={board.id} tone="faint">
                                <SpaceEntityIcon className="size-3 text-neutral-500" aria-hidden />
                                {board.name}
                            </Pill>
                        ))}
                    </Facet>
                )}

                {resource.tags.length > 0 && (
                    <Facet label="Tags">
                        {resource.tags.slice(0, 12).map((tag) => (
                            <TagDisplay key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                        {resource.tags.length > 12 && (
                            <span className="text-[11px] text-neutral-600">
                                +{resource.tags.length - 12}
                            </span>
                        )}
                    </Facet>
                )}

                {resource.members.length > 0 && (
                    <Facet label={`${resource.members.length} members`}>
                        <span className="flex -space-x-1">
                            {resource.members.slice(0, 8).map((member) => (
                                <PlaygroundAvatar
                                    key={member.id}
                                    letter={member.name.charAt(0).toUpperCase()}
                                    tone={toneFor(member.id)}
                                    size="sm"
                                    className="rounded-full ring-1 ring-background"
                                />
                            ))}
                        </span>
                    </Facet>
                )}
            </div>
        </DarwinCard>
    );
}

function Facet({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] tracking-[0.04em] text-neutral-600 uppercase">
                {label}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        </div>
    );
}

function MemberList({ resource }: { resource: Extract<DarwinResource, { kind: "members" }> }) {
    return (
        <DarwinCard title={countLabel(resource.total, "member")}>
            <div className="px-1 pb-1">
                <DarwinReveal preview={DARWIN_LIST_PREVIEW} label={showMore}>
                    {resource.items.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                        >
                            <PlaygroundAvatar
                                letter={initialOf(member.name, member.email)}
                                src={member.image ?? undefined}
                                tone={toneFor(member.id)}
                                size="lg"
                                className="rounded-full"
                            />
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-[13px] text-overlay">
                                    {displayNameOf(member.name, member.email)}
                                    {member.isViewer && (
                                        <span className="text-neutral-500"> · you</span>
                                    )}
                                </span>
                                <span className="truncate text-[11.5px] text-neutral-500">
                                    {member.email}
                                </span>
                            </span>
                            <ProjectRoleTicker role={member.role} size="sm" />
                        </div>
                    ))}
                </DarwinReveal>
            </div>
        </DarwinCard>
    );
}

function BoardItem({ resource }: { resource: Extract<DarwinResource, { kind: "board_item" }> }) {
    return (
        <div className="flex items-center gap-2">
            {resource.color ? (
                <TagDisplay name={resource.name} color={resource.color} />
            ) : (
                <Pill tone="faint">
                    <SpaceEntityIcon className="size-3 text-neutral-500" aria-hidden />
                    {resource.name}
                </Pill>
            )}
            <span className="text-[11.5px] text-neutral-500">
                new {resource.item}
                {resource.parent ? ` in ${resource.parent}` : ""}
            </span>
        </div>
    );
}

function CommentCard({ resource }: { resource: Extract<DarwinResource, { kind: "comment" }> }) {
    const identifier = useIssueIdentifier();
    return (
        <DarwinCard title={`Comment on ${identifier(resource.issueNumber)}`}>
            <div className="flex gap-2 px-3 pt-1 pb-3">
                <PlaygroundAvatar
                    letter={resource.by.charAt(0).toUpperCase()}
                    tone={toneFor(resource.by)}
                    size="sm"
                    className="mt-0.5 shrink-0 rounded-full"
                />
                <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-neutral-300">
                    {resource.text}
                </p>
            </div>
        </DarwinCard>
    );
}

function BulkResult({ resource }: { resource: Extract<DarwinResource, { kind: "bulk" }> }) {
    const identifier = useIssueIdentifier();
    return (
        <div className="flex flex-col gap-2">
            {resource.updated.length > 0 && (
                <DarwinCard title={`${countLabel(resource.updated.length, "issue")} updated`}>
                    <div className="px-1 pb-1">
                        <DarwinReveal preview={DARWIN_LIST_PREVIEW} label={showMore}>
                            {resource.updated.map((issue: DarwinIssueCard) => (
                                <DarwinIssueRow key={issue.id} issue={issue} />
                            ))}
                        </DarwinReveal>
                    </div>
                </DarwinCard>
            )}

            {resource.refused.length > 0 && (
                <DarwinCard title={`${resource.refused.length} not changed`}>
                    <ul className="flex flex-col gap-1 px-3 pb-2.5">
                        {resource.refused.map((entry) => (
                            <li key={entry.number} className="text-[12px] text-neutral-500">
                                <span className="font-mono text-neutral-400">
                                    {identifier(entry.number)}
                                </span>{" "}
                                {entry.reason}
                            </li>
                        ))}
                    </ul>
                </DarwinCard>
            )}
        </div>
    );
}
