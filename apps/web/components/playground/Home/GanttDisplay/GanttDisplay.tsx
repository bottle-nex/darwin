import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";

import GanttBoard from "./GanttBoard";

/** Projects surface → Gantt: the selected project's live worker timeline. */
export default function GanttDisplay() {
    return (
        <>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            <GanttBoard />
        </>
    );
}
