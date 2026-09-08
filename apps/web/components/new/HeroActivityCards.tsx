import { ISSUE_LANE_NAME } from "@trydarwin/types";
import {
    CalendarIcon,
    ChangedFilesIcon,
    MergeIcon,
    PullRequestOpenIcon,
    ReviewVerdictApprovedIcon,
} from "@trydarwin/ui/icons";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import IconWrapper from "@/components/ui/IconWrapper";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { KanbanStatus } from "@/types/kanban";

const CARD =
    "w-full rounded-xl border border-edge bg-snow p-3.5 shadow-[0_14px_30px_-16px_rgba(24,24,27,0.28)]";

const IDENTIFIER = "font-mono text-[11px] tracking-[0.04em] text-muted-foreground";

const CARD_TITLE = "line-clamp-2 text-[14px] leading-snug font-medium text-foreground";

const CHIP_ROW = "mt-2.5 flex items-center gap-1.5 overflow-hidden p-0.25";

const CHIP_SURFACE = "text-muted-foreground ring-edge";

const FOOTNOTE = "mt-2.5 text-[11px] leading-none text-muted-foreground/80";

const todoColumn = KanbanBoard.columnFor(KanbanStatus.Todo);
const StatusIcon = todoColumn?.icon;
const urgentPriority = PRIORITY_OPTIONS.find((option) => option.value === "urgent");

export default function HeroActivityCards({ className }: { className?: string }) {
    return (
        <div className={cn("flex w-[21rem] flex-col", className)}>
            <article className={cn(CARD, "-rotate-1")}>
                <div className="flex items-center justify-between gap-2">
                    <span className={IDENTIFIER}>MAT-142</span>
                    <span className="flex shrink-0 items-center -space-x-1">
                        <PlaygroundAvatar
                            letter="R"
                            tone={toneFor("rishi")}
                            className="-rotate-7"
                        />
                        <PlaygroundAvatar letter="M" tone={toneFor("darwin-agent")} />
                    </span>
                </div>

                <div className="mt-2 flex items-start gap-1.5">
                    {StatusIcon && (
                        <StatusIcon
                            className="mt-px size-4.25 shrink-0 text-neutral-500"
                            aria-label={ISSUE_LANE_NAME[KanbanStatus.Todo]}
                        />
                    )}
                    <p className={CARD_TITLE}>OTP verify returns null once the code has expired</p>
                </div>

                <div className={CHIP_ROW}>
                    {urgentPriority && (
                        <IconWrapper
                            variant="outline"
                            icon={urgentPriority.icon}
                            iconClassName={urgentPriority.iconClassName}
                            className={cn("size-6", CHIP_SURFACE)}
                        />
                    )}
                    <TagDisplay name="auth" color="#7c5ce6" className={CHIP_SURFACE} />
                    <IconWrapper
                        variant="outline"
                        icon={CalendarIcon}
                        iconClassName={DATE_ICON_COLOR.target}
                        className={cn("px-2.5", CHIP_SURFACE)}
                    >
                        Mar 4
                    </IconWrapper>
                </div>

                <p className={FOOTNOTE}>Created Mar 2</p>
            </article>

            <article className={cn(CARD, "relative -mt-6 ml-7 rotate-1")}>
                <div className="flex items-center justify-between gap-2">
                    <span className={IDENTIFIER}>#142</span>
                    <PlaygroundAvatar letter="M" tone={toneFor("darwin-agent")} />
                </div>

                <div className="mt-2 flex items-start gap-1.5">
                    <PullRequestOpenIcon className="mt-px size-4.25 shrink-0 text-emerald-600" />
                    <p className={CARD_TITLE}>Throw OtpExpiredError instead of returning null</p>
                </div>

                <div className={CHIP_ROW}>
                    <IconWrapper
                        variant="outline"
                        icon={ChangedFilesIcon}
                        className={cn("px-2.5", CHIP_SURFACE)}
                    >
                        3 files
                    </IconWrapper>
                    <IconWrapper
                        variant="outline"
                        icon={MergeIcon}
                        iconClassName="text-emerald-600"
                        className="px-2.5 text-emerald-700 ring-emerald-500/25"
                    >
                        Ready to merge
                    </IconWrapper>
                </div>

                <p className={cn(FOOTNOTE, "flex items-center gap-1.5")}>
                    <ReviewVerdictApprovedIcon className="size-3.5 text-emerald-600" />
                    All checks passed
                </p>
            </article>
        </div>
    );
}
