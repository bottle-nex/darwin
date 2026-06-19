import { MdAssignment } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function AssignedToMePane() {
    return (
        <PaneEmptyState
            icon={MdAssignment}
            title="Assigned to me"
            subtitle="Issues assigned to you will be collected here."
        />
    );
}
