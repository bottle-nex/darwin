import { MdAssignmentTurnedIn } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function ReviewsMainPane() {
    return (
        <PaneEmptyState
            icon={MdAssignmentTurnedIn}
            title="Reviews"
            subtitle="Pull requests awaiting your review will be listed here."
        />
    );
}
