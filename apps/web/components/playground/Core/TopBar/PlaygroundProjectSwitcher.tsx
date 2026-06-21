"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { MdCheck, MdKeyboardArrowDown, MdFolder } from "react-icons/md";
import { cn } from "@/lib/utils";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import SidebarSearch from "../../Sidebar/SidebarSearch";

const DEFAULT_FOLDER_COLOR = "#6366f1";

/** Top-bar project switcher — shows the active project and lets you jump to another. */
export default function PlaygroundProjectSwitcher() {
    const router = useRouter();
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const projects = dashboard?.projects ?? [];
    const active = projects.find((p) => p.slug === projectSlug);
    const activeColor = active?.color ?? DEFAULT_FOLDER_COLOR;
    const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    function selectProject(slug: string) {
        setOpen(false);
        setQuery("");
        if (slug !== projectSlug) router.push(`/playground/${orgSlug}/${slug}`);
    }

    return (
        <Popover.Root
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery("");
            }}
        >
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className="flex h-7 cursor-pointer items-center gap-2 rounded-md bg-white/5 px-2 text-[13px] font-semibold text-neutral-100 outline-none hover:bg-white/10 data-[state=open]:bg-white/10"
                >
                    <MdFolder
                        className="size-3.5 shrink-0"
                        style={{ color: activeColor, fill: activeColor }}
                        aria-hidden
                    />
                    <span className="max-w-60 truncate">{active?.name ?? "Select a project"}</span>
                    <MdKeyboardArrowDown className="size-3 text-neutral-500" aria-hidden />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={6}
                    className="z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-2 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                    <SidebarSearch
                        value={query}
                        onChange={setQuery}
                        onClose={() => setOpen(false)}
                        placeholder="Search projects..."
                    />
                    <div
                        data-lenis-prevent
                        className="mt-2 flex max-h-72 flex-col gap-0.5 overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="px-2 py-3 text-center text-[12px] text-neutral-500">
                                No projects found.
                            </div>
                        ) : (
                            filtered.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProject(p.slug)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none",
                                        p.slug === projectSlug
                                            ? "bg-white/10 text-neutral-100"
                                            : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
                                    )}
                                >
                                    <MdFolder
                                        className="size-3.5 shrink-0"
                                        style={{
                                            color: p.color ?? DEFAULT_FOLDER_COLOR,
                                            fill: p.color ?? DEFAULT_FOLDER_COLOR,
                                        }}
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                    {p.slug === projectSlug && (
                                        <MdCheck
                                            className="size-3.5 shrink-0 text-neutral-400"
                                            aria-hidden
                                        />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
