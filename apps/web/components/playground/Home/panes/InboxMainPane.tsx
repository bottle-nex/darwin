import { MdInbox } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function InboxMainPane() {
    return (
        <PaneEmptyState
            icon={MdInbox}
            title="Inbox"
            subtitle="Issues and notifications routed to you will show up here."
        />
    );
}
