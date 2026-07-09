import { MdAutoAwesome } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function AllRunsDisplay() {
    return (
        <PaneEmptyState
            icon={MdAutoAwesome}
            title="All Runs"
            subtitle="Every agent run across your organization will be listed here."
        />
    );
}
