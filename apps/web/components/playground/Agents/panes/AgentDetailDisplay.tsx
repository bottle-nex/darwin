import { MdSmartToy } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Placeholder detail view for a selected agent (keyed by its id). */
export default function AgentDetailDisplay({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={MdSmartToy}
            title={`Agent ${id}`}
            subtitle="Configuration and recent runs for this agent will appear here."
        />
    );
}
