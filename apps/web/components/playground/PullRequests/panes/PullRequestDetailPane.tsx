import { GitPullRequest } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

/** Placeholder detail view for a selected pull request (keyed by its id). */
export default function PullRequestDetailPane({ id }: { id: string }) {
    return (
        <PaneEmptyState
            icon={GitPullRequest}
            title={`Pull request ${id}`}
            subtitle="Diff, checks, and review status will appear here."
        />
    );
}
