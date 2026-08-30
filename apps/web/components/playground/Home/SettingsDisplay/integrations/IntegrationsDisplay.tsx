"use client";
import { GithubLogoIcon } from "@trymatcha/ui/icons";
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
                <h2 className="text-sm font-medium text-snow">Integrations</h2>
                <p className="text-[13px] text-snow/60">
                    Connect the tools your team already files work in. Issues flow onto this
                    project&apos;s board automatically.
                </p>
            </header>

            <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <li>
                    <IntegrationCard
                        icon={GithubLogoIcon}
                        name="GitHub"
                        description="Mirror newly opened GitHub issues onto this project's board, tagged so you can tell them apart."
                        status={status}
                        note={repo ?? "Connect a repository to this project first"}
                        onSelect={() => setView({ kind: "github" })}
                        className="h-full w-full"
                    />
                </li>
            </ul>
        </section>
    );
}
