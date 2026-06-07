import { Bot } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Placeholder detail view for a selected agent (keyed by its id). */
export default function AgentDetailPane({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={Bot}
            title={`Agent ${id}`}
            subtitle="Configuration and recent runs for this agent will appear here."
        />
    );
}
