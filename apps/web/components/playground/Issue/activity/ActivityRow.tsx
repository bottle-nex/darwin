"use client";
import { ActivityType, ActorType, type IssueActivity } from "@trymatcha/types";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import UserInfoCard from "@/components/playground/Core/components/UserInfoCard";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import RunLogDisclosure from "../logs/RunLogDisclosure";
import { activity_entry } from "./activity.registry";

export type ActivityActorView = {
    id: string;
    userId: string | null;
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
            userId: null,
            name: frozen?.name ?? "matcha",
            image: null,
            isAgent: true,
        };
    }
    return {
        id: activity.actorUserId ?? activity.id,
        userId: activity.actorUserId,
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
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full",
                    className,
                )}
            >
                <HeroBuddy move={false} className="size-4" />
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

const RAIL_CLASS = "absolute left-[10.5px] w-[0.5px] bg-snow/28";

const ACTOR_NAME_CLASS =
    "font-medium text-snow/60 hover:text-snow transition-colors transform duration-200";

function ActorName({ actor }: { actor: ActivityActorView }) {
    const name = <span className={ACTOR_NAME_CLASS}>{actor.name}</span>;
    if (!actor.userId) return name;

    return (
        <InfoTooltip
            content={
                <UserInfoCard
                    userId={actor.userId}
                    fallbackName={actor.name}
                    fallbackImage={actor.image}
                />
            }
        >
            {name}
        </InfoTooltip>
    );
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
    const { glyph, render, detail } = activity_entry(activity.type);
    const { icon: Icon, iconClassName } = glyph(activity.payload);
    const actor = actor_of(activity);
    const at = new Date(activity.createdAt);
    const predicate = render(activity.payload);

    return (
        <div className="relative flex items-start gap-x-2.5 pt-1.5 pb-1">
            {rail.above && <span aria-hidden className={cn(RAIL_CLASS, "top-0 h-1.5")} />}
            {rail.below && <span aria-hidden className={cn(RAIL_CLASS, "top-7 bottom-0")} />}
            <span
                aria-hidden
                className="relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full"
            >
                <Icon className={cn("size-3.5", iconClassName)} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-[22px] wrap-anywhere text-neutral-500">
                    <ActorName actor={actor} />{" "}
                    {detail ? (
                        <HoverCard openDelay={120} closeDelay={80}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline decoration-edge decoration-dotted underline-offset-4 hover:decoration-neutral-500">
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
                        className="ml-2 text-[11px] whitespace-nowrap text-snow/80"
                    >
                        {formatRelativeTime(at)}
                    </time>
                </p>
                {activity.type === ActivityType.RunStarted && activity.session && (
                    <RunLogDisclosure session={activity.session} />
                )}
            </div>
        </div>
    );
}
