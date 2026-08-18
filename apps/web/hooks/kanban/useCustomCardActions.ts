"use client";
import { toast } from "@/lib/toast";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDeleteIssue } from "@/hooks/issues/useDeleteIssue";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";

export function useCustomCardActions(cardId: string) {
    const projectId = useActiveProject()?.id;
    const deleteIssue = useDeleteIssue();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();

    const removeCard = async () => {
        if (!projectId) return;
        useCustomKanbanStore.getState().removeCardLocal(cardId);
        try {
            await deleteIssue.mutateAsync({ id: cardId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the issue.");
        }
    };

    const assignMember = async (userId: string) => {
        if (!projectId) return;
        try {
            await assignIssue.mutateAsync({ id: cardId, project_id: projectId, user_id: userId });
        } catch {
            toast.error("Couldn't assign the member.");
        }
    };

    const unassignMember = async (userId: string) => {
        if (!projectId) return;
        try {
            await unassignIssue.mutateAsync({ id: cardId, project_id: projectId, user_id: userId });
        } catch {
            toast.error("Couldn't unassign the member.");
        }
    };

    const pendingAssigneeId = assignIssue.isPending
        ? (assignIssue.variables?.user_id ?? null)
        : unassignIssue.isPending
          ? (unassignIssue.variables?.user_id ?? null)
          : null;

    return { removeCard, assignMember, unassignMember, pendingAssigneeId };
}
