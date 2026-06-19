import { MdEditDocument } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function DraftsPane() {
    return (
        <PaneEmptyState
            icon={MdEditDocument}
            title="Drafts"
            subtitle="Issues you've started but not yet filed live here."
        />
    );
}
