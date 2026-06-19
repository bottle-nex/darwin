"use client";

import { FaCodePullRequest } from "react-icons/fa6";
import Row from "../../Sidebar/SidebarRow";
import Section from "../../Sidebar/SidebarSection";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../Sidebar/shared";

// PRs agents have opened from workers back to the connected repos.
const PULL_REQUESTS: { id: string; title: string; repo: string }[] = [
    { id: "pr-142", title: "Fix OTP expiry race", repo: "trymatcha-api" },
    { id: "pr-139", title: "Board drag handles", repo: "trymatcha-web" },
    { id: "pr-128", title: "Worker cold-start cache", repo: "trymatcha-api" },
];

export const rows: SidebarNavRow[] = PULL_REQUESTS.map((pr) => ({ id: pr.id, label: pr.title }));

export default function PlaygroundSidebarPullRequestsSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const rows = PULL_REQUESTS.filter((pr) => matchesQuery(pr.title, query));
    if (rows.length === 0) return null;

    return (
        <div className="mt-1">
            <Section title="Pull Requests">
                {rows.map((pr) => (
                    <Row
                        key={pr.id}
                        label={pr.title}
                        suffix={pr.repo}
                        leading={{ kind: "icon", icon: FaCodePullRequest }}
                        active={selectedRowId === pr.id}
                        onClick={() => onSelect(pr.id)}
                    />
                ))}
            </Section>
        </div>
    );
}
