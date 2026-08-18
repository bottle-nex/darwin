"use client";
import { LuBot } from "react-icons/lu";
import { ActorType, type IssueActivity } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { activity_entry } from "./activity.registry";

export type ActivityActorView = {
    id: string;
    name: string;
    image: string | null;
    isAgent: boolean;
};

/**
 * The live actor when the row still points at one, falling back to the name and
 * avatar frozen into the payload — actor relations are `SetNull`, so a deleted
 * user or a recycled worker leaves the snapshot as the only record.
 */
export function actor_of(activity: IssueActivity): ActivityActorView {
    const frozen = activity.payload?.actor;
    if (activity.actorType === ActorType.Agent) {
        return {
            id: activity.actorWorkerId ?? "agent",
            name: frozen?.name ?? "matcha",
            image: null,
            isAgent: true,
        };
    }
    return {
        id: activity.actorUserId ?? activity.id,
        name: activity.actorUser?.name ?? frozen?.name ?? "Someone",
        image: activity.actorUser?.image ?? frozen?.image ?? null,
        isAgent: false,
    };
}

export function ActorAvatar({
    actor,
    className,
}: {
    actor: ActivityActorView;
    className?: string;
}) {
    if (actor.isAgent) {
        return (
            <span
                aria-hidden
                className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
                    className,
                )}
            >
                <LuBot className="size-2.5" />
            </span>
        );
    }
    return (
        <PlaygroundAvatar
            letter={actor.name.charAt(0).toUpperCase()}
            src={actor.image}
            tone={toneFor(actor.id)}
            size="sm"
            className={cn("rounded-full", className)}
        />
    );
}

/** The 17px offsets are the distance from the row's top edge to its icon centre. */
function railClass(above: boolean, below: boolean): string | null {
    if (above && below) return "top-0 h-full";
    if (above) return "top-0 h-[17px]";
    if (below) return "top-[17px] bottom-0";
    return null;
}

/**
 * One timeline entry. `rail` says which neighbours are activity rows too, so the
 * connector stops cleanly wherever a comment breaks the run.
 */
export default function ActivityRow({
    activity,
    rail = { above: true, below: true },
}: {
    activity: IssueActivity;
    rail?: { above: boolean; below: boolean };
}) {
    const { icon: Icon, render, detail } = activity_entry(activity.type);
    const actor = actor_of(activity);
    const at = new Date(activity.createdAt);
    const railSpan = railClass(rail.above, rail.below);
    const predicate = render(activity.payload);

    return (
        <li className="relative flex items-start gap-x-2.5 py-1">
            {railSpan && (
                <span
                    aria-hidden
                    className={cn("absolute left-[10.5px] w-px bg-white/8", railSpan)}
                />
            )}
            <span
                aria-hidden
                className="relative z-10 mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#151515] text-neutral-500 ring-1 ring-white/8"
            >
                <Icon className="size-3" />
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-[22px] wrap-anywhere text-neutral-500">
                <ActorAvatar actor={actor} className="mr-1.5 -mt-px align-middle" />
                <span className="font-medium text-neutral-300">{actor.name}</span>{" "}
                {detail ? (
                    <HoverCard openDelay={120} closeDelay={80}>
                        <HoverCardTrigger asChild>
                            <span className="cursor-default underline decoration-white/15 decoration-dotted underline-offset-4 hover:decoration-white/40">
                                {predicate}
                            </span>
                        </HoverCardTrigger>
                        <HoverCardContent side="top" align="start" className="p-2">
                            {detail(activity.payload)}
                        </HoverCardContent>
                    </HoverCard>
                ) : (
                    predicate
                )}
                <time
                    dateTime={at.toISOString()}
                    title={at.toLocaleString()}
                    className="ml-2 text-[11px] whitespace-nowrap text-neutral-600"
                >
                    {formatRelativeTime(at)}
                </time>
            </p>
        </li>
    );
}
