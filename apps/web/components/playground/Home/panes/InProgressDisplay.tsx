import { MdAccessTimeFilled } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function InProgressDisplay() {
    return (
        <PaneEmptyState
            icon={MdAccessTimeFilled}
            title="In Progress"
            subtitle="Work currently being implemented will show up here."
        />
    );
}
