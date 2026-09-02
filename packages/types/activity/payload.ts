import type { ActivityType, IssueStatus } from "../prisma/enums.prisma";

// this is a snapshot of the actor at the time the activity was written
// if the user got removed from the project then it will show null there
export interface ActivityActorSnapshot {
    name: string | null;
    image: string | null;
}

interface ActivityPayloadBase {
    actor?: ActivityActorSnapshot;
}

interface DateRange {
    startDate: string | null;
    targetDate: string | null;
}

export interface ActivityHarnessConfigRef {
    harness: string;
    model: string | null;
    effort: string | null;
}

interface WrittenActivityPayloads {
    StatusChanged: ActivityPayloadBase & { from: ActivityLocationRef; to: ActivityLocationRef };
    PriorityChanged: ActivityPayloadBase & { from: number; to: number };
    TitleChanged: ActivityPayloadBase & { from: string; to: string };
    AssigneeAdded: ActivityPayloadBase & { user: ActivityUserRef };
    AssigneeRemoved: ActivityPayloadBase & { user: ActivityUserRef };
    LabelAdded: ActivityPayloadBase & { label: ActivityLabelRef };
    LabelRemoved: ActivityPayloadBase & { label: ActivityLabelRef };
    DatesChanged: ActivityPayloadBase & { from: DateRange; to: DateRange };
    IssueReopened: ActivityPayloadBase & {
        note: string;
        noteText?: string;
        from: ActivityLocationRef;
        attemptNumber: number;
    };
    RunStarted: ActivityPayloadBase & { attemptNumber: number };
    RunCompleted: ActivityPayloadBase & { attemptNumber: number; summary?: string };
    AttemptFailed: ActivityPayloadBase & { attemptNumber: number; reason: string };
    PrOpened: ActivityPayloadBase & { url: string };
    PrMerged: ActivityPayloadBase & { url: string };
    PrClosed: ActivityPayloadBase & { url: string };
    HarnessConfigChanged: ActivityPayloadBase & {
        from: ActivityHarnessConfigRef | null;
        to: ActivityHarnessConfigRef;
    };
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

export type ActivityLocationRef =
    { kind: "status"; status: IssueStatus } | ({ kind: "column" } & ActivityColumnRef);

/** Discriminated by `IssueActivity.type`. */
export type ActivityPayloadMap = {
    [K in ActivityType]: K extends keyof WrittenActivityPayloads
        ? WrittenActivityPayloads[K]
        : ActivityPayloadBase;
};

export type ActivityPayload = ActivityPayloadMap[ActivityType];
