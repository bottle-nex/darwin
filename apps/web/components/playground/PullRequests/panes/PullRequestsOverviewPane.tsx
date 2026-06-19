import { GitPullRequest } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function PullRequestsOverviewPane() {
    return (
        <PaneEmptyState
            icon={GitPullRequest}
            title="Pull Requests"
            subtitle="Select a pull request to see what an agent shipped."
        />
    );
}
