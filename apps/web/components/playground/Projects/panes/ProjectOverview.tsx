"use client";
import type { ComponentType } from "react";
import {
    Bot,
    CheckCircle2,
    Circle,
    ExternalLink,
    GitBranch,
    GitPullRequest,
    ListTodo,
    ScrollText,
    Server,
    type LucideIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import type { Project } from "@/types/project";

/** Any icon that takes a className — covers both lucide and react-icons. */
type IconType = ComponentType<{ className?: string }>;

const DEFAULT_FOLDER_COLOR = "#6366f1";

/**
 * Project landing view — a snapshot of where the project stands: its latest agent
 * run, setup progress, and live activity. The data is illustrative for now (the
 * issue / run domain isn't wired yet); the layout is what's real.
 */
export default function ProjectOverview({ project }: { project: Project }) {
    const color = project.color ?? DEFAULT_FOLDER_COLOR;

    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full flex-col gap-4">
                overview
            </div>
        </div>
    );
}
