import { FaCodePullRequest } from "react-icons/fa6";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Placeholder detail view for a selected pull request (keyed by its id). */
export default function PullRequestDetailPane({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={FaCodePullRequest}
            title={`Pull request ${id}`}
            subtitle="Diff, checks, and review status will appear here."
        />
    );
}
