import { FilePen } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function DraftsPane() {
    return (
        <PaneEmptyState
            icon={FilePen}
            title="Drafts"
            subtitle="Issues you've started but not yet filed live here."
        />
    );
}
