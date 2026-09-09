"use client";
import { GithubLogoIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { useIssueImportConfig } from "@/hooks/github/useIssueImportConfig";
import type { ProjectDetail } from "@/types/project";

import GithubIssueImportDisplay from "./GithubIssueImportDisplay";
import IntegrationCard, { type IntegrationStatus } from "./IntegrationCard";

type View = { kind: "index" } | { kind: "github" };

export default function IntegrationsDisplay({ project }: { project: ProjectDetail }) {
    const [view, setView] = useState<View>({ kind: "index" });
    const { data: config } = useIssueImportConfig(project.id);

    if (view.kind === "github") {
        return (
            <GithubIssueImportDisplay project={project} onBack={() => setView({ kind: "index" })} />
        );
    }

    const repo = project.githubRepoFullName;
    const status: IntegrationStatus = !repo
        ? "unavailable"
        : config?.enabled
          ? "connected"
          : "available";

    return (
        <section className="flex flex-col gap-5">
            <header className="flex flex-col gap-1">
                <h2 className="text-sm font-medium text-overlay">Integrations</h2>
            </header>

            <ul className="flex w-full max-w-90 list-none flex-col gap-3">
                <li>
                    <IntegrationCard
                        icon={GithubLogoIcon}
                        name="GitHub"
                        description="Mirror new GitHub issues onto this project's board."
                        status={status}
                        onSelect={() => setView({ kind: "github" })}
                    />
                </li>
            </ul>
        </section>
    );
}
