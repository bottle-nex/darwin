import type { ProjectAction } from "@trydarwin/access-control";
import type { ProjectRole } from "@trydarwin/database";
import type { DarwinResource } from "@trydarwin/types";
import type z from "zod";

/**
 * What one tool call produced, split by audience.
 *
 * The two are built from the same query but carry different things: the model gets names and prose
 * and nothing else, because `output` is resent on every later iteration of the loop; the card gets
 * ids and colours, because an avatar needs an id to keep its colour and a tag chip needs its hex.
 * Deriving one from the other is not possible in either direction, which is why both are returned
 * rather than one being presented from the other.
 *
 * @example
 * return { output: { total, issues: rows.map(trim_issue) },
 *          resource: { kind: "issues", items: rows.map(card_issue), total, hasMore } };
 */
export type DarwinToolResult = {
    output: unknown;
    /**
     * Built lazily, and by the seam inside a try/catch.
     *
     * A card is drawn *after* the tool's side effect. Building it eagerly means a mapping slip
     * turns a comment that was genuinely posted into "that did not work" — and the model, told to
     * recover, posts it a second time. A dropped card costs nothing; a repeated write costs a lot.
     */
    resource?: () => DarwinResource;
};

/**
 * Everything a tool handler is allowed to know about who is asking.
 *
 * There is no `orgId` and no way to widen `projectId`: the project comes from the HTTP request
 * and the role is resolved once at entry, so a model that invents a project id has nowhere to
 * put it. No tool input schema may contain a `project_id`, `org_id` or `user_id` field.
 */
export type DarwinContext = {
    userId: string;
    userName: string;
    projectId: string;
    projectName: string;
    role: ProjectRole;
};

/**
 * One capability offered to the model.
 *
 * `description` is written for the model — say when to reach for it. The JSDoc above each tool
 * is written for the next engineer — say how it is scoped. Different audiences, different text.
 */
export type DarwinTool<Schema extends z.ZodType = z.ZodType> = {
    name: string;
    description: string;
    input: Schema;
    /** Read-only tools fan out with Promise.all; a batch containing a write runs sequentially. */
    readOnly: boolean;
    /** Checked against the caller's role before `run` is ever reached. */
    action: ProjectAction;
    /**
     * Hold this tool's card back and draw it only if nothing else in the run produced one.
     *
     * `get_project_context` is told to run before every write, so "file an issue tagged bug" would
     * otherwise put a whole project panel above the one card the user asked for. It is a lookup
     * then, and the answer only when it runs alone.
     */
    fallbackCard?: boolean;
    run: (input: z.infer<Schema>, ctx: DarwinContext) => Promise<DarwinToolResult>;
};

/**
 * A tool refusing on its own terms.
 *
 * The message is handed to the model verbatim and the model is told to relay refusals, so treat
 * every one of these as user-visible: plain prose, and never the name of a tool, a parameter or
 * anything else about how this works.
 *
 * @example
 * throw new DarwinToolError("That column is not on this project's board.");
 */
export class DarwinToolError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DarwinToolError";
    }
}
