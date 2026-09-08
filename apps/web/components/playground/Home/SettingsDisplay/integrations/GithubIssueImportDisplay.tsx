"use client";
import { GithubImportTarget, IMPORTED_TAG_NAME } from "@trydarwin/types";
import { BackChevronIcon, CheckIcon, GithubLogoIcon } from "@trydarwin/ui/icons";

import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { Button } from "@/components/ui/button";
import { FIELD_LABEL } from "@/components/ui/fieldStyles";
import HelpHint from "@/components/ui/HelpHint";
import IconWrapper from "@/components/ui/IconWrapper";
import Pill from "@/components/ui/Pill";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useIssueImportConfig } from "@/hooks/github/useIssueImportConfig";
import { useUpdateIssueImportConfig } from "@/hooks/github/useUpdateIssueImportConfig";
import { useBoardDestinations } from "@/hooks/issues/useBoardDestinations";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useListTags } from "@/hooks/tags/useListTags";
import { formatRelativeTime } from "@/lib/format";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { toast } from "@/lib/toast";
import { KanbanStatus } from "@/types/kanban";
import type { ProjectDetail } from "@/types/project";

import ImportPreview from "./ImportPreview";

const AGENT_BOARD_VALUE = "agent-board";
const DEFAULT_TAG_VALUE = "default";

function LabeledField({
    label,
    help,
    children,
}: {
    label: string;
    help: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <span className={FIELD_LABEL}>{label}</span>
                <HelpHint content={help} label={`About ${label.toLowerCase()}`} />
            </div>
            {children}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-[11px] text-snow/40">{label}</dt>
            <dd className="min-w-0 truncate text-[11px] text-snow/80">{children}</dd>
        </div>
    );
}

export default function GithubIssueImportDisplay({
    project,
    onBack,
}: {
    project: ProjectDetail;
    onBack: () => void;
}) {
    const { data: config, isLoading } = useIssueImportConfig(project.id);
    const { data: tags } = useListTags(project.id);
    const update = useUpdateIssueImportConfig();

    useEscapeExit({ onExit: onBack });

    const agentLaneTitle = KanbanBoard.columnFor(KanbanStatus.Todo)?.title ?? "To Do";

    // A config picker must be able to show and re-select its current value, so
    // nothing is filtered out.
    const destinations = useBoardDestinations(undefined);

    const repo = project.githubRepoFullName;
    const enabled = config?.enabled ?? false;
    const onAgentBoard = config?.target === GithubImportTarget.AgentBoard;
    const targetValue = onAgentBoard ? AGENT_BOARD_VALUE : (config?.customColumnId ?? undefined);
    const missingSetup = !config?.target
        ? "Choose where imported issues should land."
        : config.target === GithubImportTarget.CustomColumn && !config.customColumnId
          ? "Choose which column imported issues should land in."
          : !config.tagId
            ? "Choose a tag for imported issues."
            : null;

    function save(input: Parameters<typeof update.mutate>[0], message: string, failure: string) {
        update.mutate(input, {
            onSuccess: () => toast.success(message),
            onError: () => toast.error(failure),
        });
    }

    return (
        <div className="flex flex-col gap-5">
            <Button
                type="button"
                variant="unstyled"
                onClick={onBack}
                className="flex w-fit cursor-pointer items-center gap-2 text-[14px] text-snow/50 transition-colors hover:text-snow"
            >
                <BackChevronIcon className="size-4" aria-hidden />
                Integrations
            </Button>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                {repo ? <ImportPreview repo={repo} /> : <div />}

                <section className="flex min-w-0 flex-col gap-5">
                    <header className="flex items-center gap-3">
                        <IconWrapper
                            icon={GithubLogoIcon}
                            className="size-12 shrink-0 rounded-xl"
                            iconClassName="size-6 text-snow"
                        />
                        <div className="flex min-w-0 flex-col gap-1">
                            <h2 className="truncate text-[20px] leading-none font-medium text-snow">
                                GitHub
                            </h2>
                            <span className="truncate text-[12px] text-snow/40">
                                Issue tracking · Built by darwin
                            </span>
                        </div>
                    </header>

                    {repo && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={enabled ? "positive" : "muted"} className="px-2.5">
                                {enabled && <CheckIcon className="size-3" aria-hidden />}
                                {enabled ? "Import active" : "Import off"}
                            </Pill>
                            <HelpHint
                                label="Connection details"
                                contentClassName="max-w-64"
                                content={
                                    <dl className="flex flex-col gap-1.5">
                                        <DetailRow label="Repository">{repo}</DetailRow>
                                        <DetailRow label="Issues imported">
                                            {config?.importedCount ?? 0}
                                        </DetailRow>
                                        <DetailRow label="Last import">
                                            {config?.lastImportedAt
                                                ? formatRelativeTime(config.lastImportedAt)
                                                : "Never"}
                                        </DetailRow>
                                    </dl>
                                }
                            />
                            <div className="ml-auto flex items-center gap-2">
                                {!enabled && missingSetup && (
                                    <span className="text-[11px] text-snow/35">{missingSetup}</span>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={"ghost"}
                                    disabled={
                                        isLoading ||
                                        update.isPending ||
                                        (!enabled && Boolean(missingSetup))
                                    }
                                    onClick={() =>
                                        save(
                                            { projectId: project.id, enabled: !enabled },
                                            enabled
                                                ? "GitHub import is off."
                                                : "GitHub import is on.",
                                            "Couldn't change the import.",
                                        )
                                    }
                                >
                                    {enabled ? "Deactivate" : "Activate"}
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="text-[13px] leading-[1.65] text-snow/55">
                        Your team files issues where it already works. When someone opens one on{" "}
                        {repo ?? "the connected repository"}, darwin copies it onto this
                        project&apos;s board — title, body and author — tagged so you can tell
                        imported work apart at a glance.
                    </p>

                    {!repo ? (
                        <p className="border-t border-border pt-5 text-[13px] leading-[1.65] text-snow/55">
                            This project has no repository connected, so there is nothing to import
                            from. Attach one when you create the project.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-5 border-t border-border pt-5">
                            <LabeledField
                                label="Where issues land"
                                help={
                                    onAgentBoard
                                        ? "The agent starts on them right away."
                                        : "Parked for a person to pick up."
                                }
                            >
                                <Select
                                    value={targetValue}
                                    onValueChange={(value) => {
                                        const toAgentBoard = value === AGENT_BOARD_VALUE;
                                        save(
                                            {
                                                projectId: project.id,
                                                target: toAgentBoard
                                                    ? GithubImportTarget.AgentBoard
                                                    : GithubImportTarget.CustomColumn,
                                                customColumnId: toAgentBoard ? null : value,
                                            },
                                            toAgentBoard
                                                ? `Imported issues will land in ${agentLaneTitle}.`
                                                : "Imported issues will land in that column.",
                                            "Couldn't change where issues land.",
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-full max-w-80">
                                        <SelectValue placeholder="Choose a lane or column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AGENT_BOARD_VALUE}>
                                            Agent board · {agentLaneTitle}
                                        </SelectItem>
                                        {destinations.spaces.map((space) => (
                                            <SelectGroup key={space.id}>
                                                <SelectLabel>{space.name}</SelectLabel>
                                                {space.columns.map((column) => (
                                                    <SelectItem key={column.id} value={column.id}>
                                                        {column.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </LabeledField>

                            <LabeledField
                                label="Tag"
                                help="Filters imported issues apart from the rest."
                            >
                                <Select
                                    value={config?.tagId ?? DEFAULT_TAG_VALUE}
                                    onValueChange={(value) =>
                                        save(
                                            {
                                                projectId: project.id,
                                                tagId: value === DEFAULT_TAG_VALUE ? null : value,
                                            },
                                            "Tag updated.",
                                            "Couldn't change the tag.",
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full max-w-80">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={DEFAULT_TAG_VALUE}>
                                            {IMPORTED_TAG_NAME} (created for you)
                                        </SelectItem>
                                        {(tags ?? []).map((tag) => (
                                            <SelectItem key={tag.id} value={tag.id}>
                                                <TagDisplay
                                                    name={tag.name}
                                                    color={tag.color}
                                                    className="px-0 ring-0"
                                                />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </LabeledField>

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className={FIELD_LABEL}>Existing issues</span>
                                    <HelpHint
                                        label="About existing issues"
                                        content="Imports open issues. Skips pull requests."
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={!enabled || update.isPending}
                                    onClick={() =>
                                        save(
                                            { projectId: project.id, backfill: true },
                                            "Importing existing open issues in the background.",
                                            "Couldn't start the import.",
                                        )
                                    }
                                >
                                    Import
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
