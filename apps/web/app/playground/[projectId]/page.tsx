"use client";
import { useState } from "react";
import PlaygroundIconRail from "@/components/playground/PlaygroundIconRail";
import { RailSurface } from "@/components/playground/IconRail/railSurface";
import PlaygroundTopBar from "@/components/playground/PlaygroundTopBar";
import PlaygroundWorkspace from "@/components/playground/PlaygroundWorkspace";

export default function ProjectPage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [activeSurface, setActiveSurface] = useState<RailSurface>(RailSurface.Home);

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-[#0c0c0c] text-neutral-100 pt-px">
            <PlaygroundTopBar />
            <section className="flex flex-1 min-h-0 gap-2 p-2 pt-px">
                <PlaygroundIconRail
                    activeSurface={activeSurface}
                    onSelectSurface={setActiveSurface}
                    sidebarCollapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                />
                <PlaygroundWorkspace
                    surface={activeSurface}
                    sidebarCollapsed={sidebarCollapsed}
                    onCollapseSidebar={() => setSidebarCollapsed(true)}
                />
            </section>
        </main>
    );
}
