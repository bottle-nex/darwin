import { MdAlternateEmail } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function MentionsMainPane() {
    return (
        <PaneEmptyState
            icon={MdAlternateEmail}
            title="Mentions"
            subtitle="Threads where you've been mentioned will appear here."
        />
    );
}
