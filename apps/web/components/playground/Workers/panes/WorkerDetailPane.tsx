import { Server } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Placeholder detail view for a selected worker (keyed by its id). */
export default function WorkerDetailPane({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={Server}
            title={`Worker ${id}`}
            subtitle="Build logs and status for this runner will appear here."
        />
    );
}
