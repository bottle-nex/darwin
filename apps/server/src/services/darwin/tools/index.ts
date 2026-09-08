import type { ToolDefinition } from "../darwin.types";
import bulk_update_issues_tool from "./tool.bulk_update_issues";
import comment_on_issue_tool from "./tool.comment_on_issue";
import create_board_item_tool from "./tool.create_board_item";
import create_issue_tool from "./tool.create_issue";
import find_issues_tool from "./tool.find_issues";
import get_issue_tool from "./tool.get_issue";
import get_project_context_tool from "./tool.get_project_context";
import list_members_tool from "./tool.list_members";
import type { DarwinTool } from "./tool.registry";
import { json_schema_for } from "./tool.schema";
import search_issues_tool from "./tool.search_issues";
import update_issue_tool from "./tool.update_issue";

// Reads first, then writes, then the two that touch many things at once. The model reads this
// order, so the safest tool for a question is also the first one it sees.
const TOOLS: DarwinTool[] = [
    get_project_context_tool,
    list_members_tool,
    find_issues_tool,
    search_issues_tool,
    get_issue_tool,
    create_issue_tool,
    update_issue_tool,
    comment_on_issue_tool,
    create_board_item_tool,
    bulk_update_issues_tool,
];

const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

/**
 * Every capability Darwin is offered, in the order the model sees them.
 *
 * Kept deliberately short. Each extra tool is another near-identical description the model has to
 * choose between, and wrong turns cost a whole extra round trip.
 *
 * @example
 * DarwinToolRegistry.get("find_issues")?.readOnly; // true
 */
export default class DarwinToolRegistry {
    /** The `tools` array sent on every model call. Schemas are converted once at module load. */
    static definitions(): ToolDefinition[] {
        return DEFINITIONS;
    }

    static get(name: string): DarwinTool | undefined {
        return BY_NAME.get(name);
    }

    static names(): string[] {
        return TOOLS.map((tool) => tool.name);
    }
}

const DEFINITIONS: ToolDefinition[] = TOOLS.map((tool) => ({
    type: "function",
    function: {
        name: tool.name,
        description: tool.description,
        parameters: json_schema_for(tool),
    },
}));
