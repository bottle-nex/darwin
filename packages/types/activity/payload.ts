import type { ActivityType, IssueStatus } from "../prisma/enums.prisma";

/**
 * Actor name and avatar frozen at write time. The actor relations are
 * `onDelete: SetNull`, so this is what the row renders as once the user or
 * worker it pointed at is gone.
 */
export interface ActivityActorSnapshot {
    name: string | null;
    image: string | null;
}

interface ActivityPayloadBase {
    actor?: ActivityActorSnapshot;
}

/** Dates live in JSONB, so they are ISO strings here, not `Date`. */
interface DateRange {
    startDate: string | null;
    targetDate: string | null;
}

/**
 * Payload shapes for the event types that have a writer. Every other member of
 * `ActivityType` falls back to the base — see `ActivityPayloadMap` below.
 */
interface WrittenActivityPayloads {
    StatusChanged: ActivityPayloadBase & { from: ActivityLocationRef; to: ActivityLocationRef };
    PriorityChanged: ActivityPayloadBase & { from: number; to: number };
    TitleChanged: ActivityPayloadBase & { from: string; to: string };
    AssigneeAdded: ActivityPayloadBase & { user: ActivityUserRef };
    AssigneeRemoved: ActivityPayloadBase & { user: ActivityUserRef };
    LabelAdded: ActivityPayloadBase & { label: ActivityLabelRef };
    LabelRemoved: ActivityPayloadBase & { label: ActivityLabelRef };
    DatesChanged: ActivityPayloadBase & { from: DateRange; to: DateRange };
    RunStarted: ActivityPayloadBase & { attemptNumber: number };
    RunCompleted: ActivityPayloadBase & { attemptNumber: number; summary?: string };
    AttemptFailed: ActivityPayloadBase & { attemptNumber: number; reason: string };
    PrOpened: ActivityPayloadBase & { url: string };
}

export interface ActivityUserRef {
    id: string;
    name: string | null;
    image: string | null;
}

export interface ActivityLabelRef {
    id: string;
    name: string;
    color: string;
}

export interface ActivityColumnRef {
    id: string;
    label: string;
}

/**
 * Where the issue sits on the board. `Parked` is not a state a user picks — the
 * update controller sets it whenever `customColumnId` is non-null — so status and
 * custom column are one fact with two encodings. Resolving them into a single
 * location at write time is what keeps `Parked` from ever reaching the feed.
 */
export type ActivityLocationRef =
    { kind: "status"; status: IssueStatus } | ({ kind: "column" } & ActivityColumnRef);

/** Discriminated by `IssueActivity.type`. */
export type ActivityPayloadMap = {
    [K in ActivityType]: K extends keyof WrittenActivityPayloads
        ? WrittenActivityPayloads[K]
        : ActivityPayloadBase;
};

export type ActivityPayload = ActivityPayloadMap[ActivityType];
