import { Kanban } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function KanbanMainPane() {
    return (
        <PaneEmptyState
            icon={Kanban}
            title="Kanban"
            subtitle="The board where teams file issues for agents to pick up."
        />
    );
}
