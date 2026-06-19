import { ClipboardList } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function AssignedToMePane() {
    return (
        <PaneEmptyState
            icon={ClipboardList}
            title="Assigned to me"
            subtitle="Issues assigned to you will be collected here."
        />
    );
}
