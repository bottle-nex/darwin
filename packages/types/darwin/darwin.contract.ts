import type { IssueStatus, ProjectRole } from "../prisma/enums.prisma";

export type DarwinToolState = "running" | "ok" | "error";

/** An issue as a card draws it. Ids are carried so a card can open the issue and tone an avatar. */
export type DarwinIssueCard = {
    id: string;
    number: number;
    title: string;
    status: IssueStatus;
    priority: number;
    column: string | null;
    assignees: { id: string; name: string; image: string | null }[];
    tags: { id: string; name: string; color: string }[];
    targetDate: string | null;
};

export type DarwinBoardItemKind = "tag" | "space" | "column";

/**
 * A person as a card draws them.
 *
 * `name` stays nullable and `email` rides along so the card can use the app's own `displayNameOf`
 * rather than inventing a second way to name someone. `isViewer` marks the person asking, so a row
 * says "you" instead of reading their own name back to them.
 */
export type DarwinMemberCard = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: ProjectRole;
    isViewer: boolean;
};

/**
 * Something a tool produced that the user asked to see.
 *
 * Deliberately separate from what the tool tells the model: the model gets names and prose, the
 * card gets ids and colours. Keeping them apart is what stops the model's context growing every
 * time a card learns a new field.
 */
export type DarwinResource =
    | { kind: "issues"; items: DarwinIssueCard[]; total: number; hasMore: boolean }
    | {
          kind: "issue";
          item: DarwinIssueCard;
          description: string | null;
          comments: { by: string; at: string; text: string }[];
      }
    | {
          kind: "project";
          name: string;
          summary: string | null;
          repo: string | null;
          members: { id: string; name: string; role: string }[];
          tags: { id: string; name: string; color: string }[];
          boards: { id: string; name: string; columns: string[] }[];
          totals: Record<string, number>;
      }
    | {
          kind: "board_item";
          item: DarwinBoardItemKind;
          id: string;
          name: string;
          color: string | null;
          parent: string | null;
      }
    | { kind: "members"; items: DarwinMemberCard[]; total: number }
    | { kind: "comment"; issueNumber: number; text: string; by: string }
    | {
          kind: "bulk";
          updated: DarwinIssueCard[];
          refused: { number: number; reason: string }[];
      };

/** One thing that happened during an Ask Darwin turn, before the stream layer numbers it. */
export type DarwinEventBody =
    | { type: "token"; text: string }
    | { type: "tool"; callId: string; name: string; state: DarwinToolState }
    | { type: "resource"; callId: string; resource: DarwinResource }
    | { type: "done"; messageId: string; text: string }
    | { type: "error"; code: string; message: string };

/**
 * A numbered event, as the browser receives it.
 *
 * `seq` is monotonic within a run and doubles as the replay cursor: a client that reconnects asks
 * for everything after the last seq it rendered.
 */
export type DarwinStreamEvent = DarwinEventBody & { seq: number };

export type DarwinRunOutcome = "Done" | "Cancelled" | "Error";

/** One step the answer took, and whatever it produced worth showing. */
export type DarwinToolStep = {
    callId: string;
    name: string;
    resource: DarwinResource | null;
};

/**
 * One turn as the pane renders it.
 *
 * An assistant turn is a whole run, not a row: the model may take eight loop iterations to reach an
 * answer, and those are iterations, not eight things it said. Tool rows never reach here — their
 * content is JSON written for the model — but their steps and resources do.
 */
export type DarwinUiMessage = {
    id: string;
    seq: number;
    role: "user" | "assistant";
    content: string;
    tools: DarwinToolStep[];
    createdAt: string;
};

export type DarwinThreadSummary = {
    id: string;
    title: string | null;
    updatedAt: string;
};

export type DarwinThreadDetail = {
    id: string;
    title: string | null;
    messages: DarwinUiMessage[];
    /** Set while a run is still streaming, so a reloaded tab knows what to resubscribe to. */
    activeRunId: string | null;
};

export const DARWIN_MESSAGE_MAX_LENGTH = 4000;

/** Past this many, a list collapses behind a "show more" rather than filling the pane. */
export const DARWIN_LIST_PREVIEW = 8;

/** Past this many, the step chips collapse. A one-to-three step answer shows them all. */
export const DARWIN_STEPS_PREVIEW = 3;
