export function issue_recipients(input: {
    assigneeIds: string[];
    creatorId?: string | null;
    exclude: string[];
}): string[] {
    const excluded = new Set(input.exclude);
    const recipients = new Set<string>();

    for (const id of input.assigneeIds) {
        if (!excluded.has(id)) recipients.add(id);
    }
    if (input.creatorId && !excluded.has(input.creatorId)) recipients.add(input.creatorId);

    return [...recipients];
}
