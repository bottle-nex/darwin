import type { ActivityType, ActorType, AgentSession, Prisma } from "@trymatcha/database";
import { ActivitySurface } from "@trymatcha/database";
import { type ActivityPayloadMap, OutboundSocketMessageType } from "@trymatcha/types";

import { publisher } from "./service.publisher";

type EventFor<T extends ActivityType> = {
    type: T;
    payload?: Omit<ActivityPayloadMap[T], "actor">;
    surface?: ActivitySurface;
    dedupeKey?: string;
};

export type ActivityEvent = { [T in ActivityType]: EventFor<T> }[ActivityType];

export type ActivityActor = {
    type: ActorType;
    userId?: string | null;
    workerId?: string | null;
    name?: string | null;
    image?: string | null;
};

// this just stores the sequence number for each activity row (basically what happened first)
type ActivityRow = { seq: bigint };

export const ACTIVITY_ACTOR_SELECT = { select: { id: true, name: true, image: true } } as const;

export default class ActivityService {
    static async emit(
        tx: Prisma.TransactionClient,
        input: {
            issueId: string;
            actor: ActivityActor;
            sessionId?: string | null;
            events: ActivityEvent[];
        },
    ) {
        if (!input.events.length) return [];

        const actor_snapshot = {
            name: input.actor.name ?? null,
            image: input.actor.image ?? null,
        };

        return tx.issueActivity.createManyAndReturn({
            data: input.events.map((event) => ({
                issueId: input.issueId,
                type: event.type,
                payload: {
                    ...(event.payload ?? {}),
                    actor: actor_snapshot,
                } as Prisma.InputJsonValue,
                actorType: input.actor.type,
                actorUserId: input.actor.userId ?? null,
                actorWorkerId: input.actor.workerId ?? null,
                surface: event.surface ?? ActivitySurface.Primary,
                sessionId: input.sessionId ?? null,
                dedupeKey: event.dedupeKey ?? null,
            })),
            skipDuplicates: true,
            include: { actorUser: ACTIVITY_ACTOR_SELECT },
        });
    }

    static to_wire<T extends ActivityRow>(row: T) {
        return { ...row, seq: row.seq.toString() };
    }

    static async publish(project_id: string, issue_id: string, rows: ActivityRow[]) {
        if (!rows.length) return;

        await publisher().publish_message(
            publisher().get_channel_name(project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.ACTIVITY_CREATED,
                projectId: project_id,
                payload: { issueId: issue_id, activities: rows.map(ActivityService.to_wire) },
            }),
        );
    }

    // used to emit agent session..
    static async publish_session(project_id: string, session: AgentSession) {
        await publisher().publish_message(
            publisher().get_channel_name(project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.AGENT_SESSION_UPDATED,
                projectId: project_id,
                payload: session,
            }),
        );
    }
}
