import type { DarwinLiveTurn } from "@/hooks/darwin/darwinCache";

/**
 * What each tool is called on screen.
 *
 * Tool names are the model's vocabulary; these are the user's. An unmapped name falls back to the
 * raw name with underscores removed, so a tool added on the server degrades to something readable
 * rather than to nothing.
 *
 * @example
 * darwinToolLabel("search_issues"); // "Searching issues"
 */
const TOOL_LABELS: Record<string, string> = {
    get_project_context: "Reading the project",
    list_members: "Reading the team",
    find_issues: "Reading the board",
    search_issues: "Searching issues",
    get_issue: "Reading an issue",
    create_issue: "Creating an issue",
    update_issue: "Updating an issue",
    comment_on_issue: "Adding a comment",
    create_board_item: "Adding to the board",
    bulk_update_issues: "Updating issues",
};

export function darwinToolLabel(name: string): string {
    return TOOL_LABELS[name] ?? name.replace(/_/g, " ");
}

export function darwinActivityLabel(live: DarwinLiveTurn | null): string | null {
    if (!live) return "Sending…";
    if (live.tools.some((tool) => tool.state === "running")) return null;
    return "Thinking…";
}
