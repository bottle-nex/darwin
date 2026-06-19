import { Server } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function WorkersOverviewPane() {
    return (
        <PaneEmptyState
            icon={Server}
            title="Workers"
            subtitle="Select a worker to inspect the sandbox running your project."
        />
    );
}
