import { MdStorage } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function WorkersOverviewPane() {
    return (
        <PaneEmptyState
            icon={MdStorage}
            title="Workers"
            subtitle="Select a worker to inspect the sandbox running your project."
        />
    );
}
