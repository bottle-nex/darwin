import { Inbox } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function InboxMainPane() {
    return (
        <PaneEmptyState
            icon={Inbox}
            title="Inbox"
            subtitle="Issues and notifications routed to you will show up here."
        />
    );
}
