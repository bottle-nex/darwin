import { AtSign } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function MentionsMainPane() {
    return (
        <PaneEmptyState
            icon={AtSign}
            title="Mentions"
            subtitle="Threads where you've been mentioned will appear here."
        />
    );
}
