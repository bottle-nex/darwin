import { MdStorage } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Placeholder detail view for a selected worker (keyed by its id). */
export default function WorkerDetailDisplay({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={MdStorage}
            title={`Worker ${id}`}
            subtitle="Build logs and status for this runner will appear here."
        />
    );
}
