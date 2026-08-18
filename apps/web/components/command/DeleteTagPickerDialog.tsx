"use client";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useListTags } from "@/hooks/tags/useListTags";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { useDeleteTagStore } from "@/store/tags/useDeleteTagStore";
import ResourcePickerDialog from "./ResourcePickerDialog";

export default function DeleteTagPickerDialog() {
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const requestDelete = useDeleteTagStore((s) => s.requestDelete);
    const { data: tags } = useListTags(useActiveProject()?.id);

    const list = tags ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "delete-tag"}
            onOpenChange={(next) => !next && clear()}
            title="Delete tag"
            placeholder="Search tags..."
            emptyLabel="No tags found."
            destructive
            resources={list.map((tag) => ({
                id: tag.id,
                label: tag.name,
                leading: <TagDisplay name={tag.name} color={tag.color} />,
            }))}
            onPick={(id) => {
                const tag = list.find((candidate) => candidate.id === id);
                clear();
                if (tag) requestDelete(tag);
            }}
        />
    );
}
