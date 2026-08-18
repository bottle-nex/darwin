import { ActivitySurface, ActivityType, ActorType, Prisma } from "@trymatcha/database";
import type { AgentSession } from "@trymatcha/database";
import { OutboundSocketMessageType, type ActivityPayloadMap } from "@trymatcha/types";
import { server_services } from "../index";

type EventFor<T extends ActivityType> = {
    type: T;
    payload?: Omit<ActivityPayloadMap[T], "actor">;
    surface?: ActivitySurface;
    /** Scoped to the issue by `@@unique([issueId, dedupeKey])`, so it only needs to be unique per issue. */
    dedupeKey?: string;
};

/** Discriminated by `type`, so a heterogeneous batch still typechecks each payload. */
export type ActivityEvent = { [T in ActivityType]: EventFor<T> }[ActivityType];

export type ActivityActor = {
    type: ActorType;
    userId?: string | null;
    workerId?: string | null;
    /** Frozen into every payload — the actor relations are `SetNull`. */
    name?: string | null;
    image?: string | null;
};

/** Anything Prisma hands back for `IssueActivity`, whatever was included alongside. */
type ActivityRow = { seq: bigint };

export const ACTIVITY_ACTOR_SELECT = { select: { id: true, name: true, image: true } } as const;

export default class ActivityService {
    /**
     * Appends timeline rows in the caller's transaction, so an activity row can
     * never outlive a mutation that rolled back. Publish separately, after commit.
     */
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

    /** `seq` is a BigInt and would throw in `JSON.stringify`. See `IssueActivity` in @trymatcha/types. */
    static to_wire<T extends ActivityRow>(row: T) {
        return { ...row, seq: row.seq.toString() };
    }

    /** One message per batch — N publishes for one PATCH can land out of order. */
    static async publish(project_id: string, issue_id: string, rows: ActivityRow[]) {
        if (!rows.length) return;

        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.ACTIVITY_CREATED,
                projectId: project_id,
                payload: { issueId: issue_id, activities: rows.map(ActivityService.to_wire) },
            }),
        );
    }

    static async publish_session(project_id: string, session: AgentSession) {
        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.AGENT_SESSION_UPDATED,
                projectId: project_id,
                payload: session,
            }),
        );
    }
}
