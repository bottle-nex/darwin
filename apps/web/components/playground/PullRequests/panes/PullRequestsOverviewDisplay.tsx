import { FaCodePullRequest } from "react-icons/fa6";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function PullRequestsOverviewDisplay() {
    return (
        <PaneEmptyState
            icon={FaCodePullRequest}
            title="Pull Requests"
            subtitle="Select a pull request to see what an agent shipped."
        />
    );
}
