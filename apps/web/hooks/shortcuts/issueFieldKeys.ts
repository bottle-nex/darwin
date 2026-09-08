import { ISSUE_PAGE_TITLE } from "@/components/command/CommandIssuePage";
import { COMBINATIONS } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { CommandKind, type IssueCommandPage } from "@/types/command.type";

const KEYS_BY_SHORTCUT_LABEL = new Map(
    Object.entries(COMBINATIONS)
        .filter(([, action]) => action.kind === CommandKind.Issue)
        .map(([combination, action]) => [action.label, combination.split(" ")]),
);

export function issueFieldKeys(field: IssueCommandPage): string[] | undefined {
    return KEYS_BY_SHORTCUT_LABEL.get(ISSUE_PAGE_TITLE[field]);
}
