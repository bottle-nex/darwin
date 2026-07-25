"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FaCodeBranch, FaFolder, FaGithub } from "react-icons/fa6";
import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/types/project";

const DEFAULT_COLOR = "#6366f1";

export default function ProjectCard({
    project,
    orgSlug,
}: {
    project: Project;
    orgSlug: string;
    index?: number;
}) {
    const router = useRouter();
    const { name, slug, description, color, createdAt } = project;
    const accent = color ?? DEFAULT_COLOR;
    const branch = project.githubDefaultBranch;

    return (
        <div className="group relative flex w-full flex-col gap-4 rounded-[14px] bg-linear-to-b from-[#1a1a1a] to-neutral-900 p-5 text-left shadow-[inset_0_2px_0_0_#262626] focus-within:ring-2 focus-within:ring-white/20">
            <Button
                variant="unstyled"
                type="button"
                aria-label={`Open ${name}`}
                onClick={() => router.push(`/playground/${orgSlug}/${slug}`)}
                className="absolute inset-0 z-0 cursor-pointer rounded-[14px] focus:outline-none"
            />

            <div className="pointer-events-none relative z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: accent }}
                        >
                            <FaFolder className="size-3 text-white" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-50">
                                {name}
                            </h3>
                            <p className="truncate font-mono text-[11px] tracking-tight text-neutral-500">
                                @{slug}
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[10px] tracking-tight text-neutral-600 tabular-nums">
                        {formatRelativeTime(createdAt)}
                    </span>
                </div>

                <p className="line-clamp-2 text-[13px] leading-relaxed text-neutral-400">
                    {description?.trim() || "No description provided."}
                </p>

                <div className="flex items-center gap-3 text-[11px] tracking-tight text-neutral-500 [&_svg]:text-neutral-600">
                    {project.githubRepoFullName ? (
                        project.githubRepoUrl ? (
                            <a
                                href={project.githubRepoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.25 font-mono text-[12px] text-neutral-300 transition-colors hover:bg-white/10 hover:text-neutral-100 shadow-[inset_0_1px_0_0_#2f2f2f]"
                            >
                                <FaGithub className="size-3 shrink-0 text-snow!" />
                                <span className="truncate">{project.githubRepoFullName}</span>
                            </a>
                        ) : (
                            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-mono text-[12px] text-neutral-400 ring-1 ring-white/10">
                                <FaGithub className="size-3 shrink-0 text-snow!" />
                                <span className="truncate">{project.githubRepoFullName}</span>
                            </span>
                        )
                    ) : (
                        <span className="text-neutral-600">No repo connected</span>
                    )}

                    {branch && (
                        <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono">
                            <FaCodeBranch className="size-3" />
                            {branch}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
