"use client";
import type { Project } from "@/types/project";

export default function ProjectOverview({ project }: { project: Project }) {
    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full flex-col gap-4">overview</div>
        </div>
    );
}
