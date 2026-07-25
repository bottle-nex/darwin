"use client";
import { MdAdd, MdSearch } from "react-icons/md";
import { TbLayoutSidebarFilled } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import PlaygroundProjectSwitcher from "./PlaygroundProjectSwitcher";
import GithubConnectButton from "./GithubConnectButton";
import NotificationsBellButton from "./NotificationsBellButton";
import PlaygroundUserMenu from "./PlaygroundUserMenu";
export default function PlaygroundTopBar() {
    const { setOpen } = useNewProjectStore();
    const collapsed = useSidebarWidthStore((s) => s.collapsed);
    const toggle = useSidebarWidthStore((s) => s.toggle);

    return (
        <header className="relative flex h-11 shrink-0 items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-1">
                {collapsed && (
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={toggle}
                        aria-label="Expand sidebar"
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                    >
                        <TbLayoutSidebarFilled className="size-4" aria-hidden />
                    </Button>
                )}
                <PlaygroundProjectSwitcher />
            </div>
            <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
                <MdSearch
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500"
                    aria-hidden
                />
                <Input
                    placeholder="Search"
                    className="h-7 w-full rounded-md border-white/5 pl-8 pr-12 text-[12px] text-neutral-100 placeholder:text-neutral-500"
                />
                <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 flex items-center rounded bg-cement px-1.5 py-0.5 text-[11px] leading-none font-medium tracking-wide text-neutral-500">
                    ⌘K
                </kbd>
            </div>

            {/* right side icons */}
            <div className="flex items-center gap-2.5">
                <NotificationsBellButton />
                <GithubConnectButton />
                <Button
                    onClick={() => setOpen(true)}
                    size="sm"
                    className="h-6.75 cursor-pointer gap-1 bg-neutral-100 px-2.5 text-[11px] font-medium text-neutral-900 hover:bg-white"
                >
                    <MdAdd className="size-3.5" aria-hidden />
                    Create Project
                </Button>
                <PlaygroundUserMenu />
            </div>

            <CreateProjectDialog />
        </header>
    );
}
