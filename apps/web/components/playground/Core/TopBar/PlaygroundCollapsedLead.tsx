"use client";
import { TbLayoutSidebarFilled } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import PlaygroundLeadBar from "./PlaygroundLeadBar";

export default function PlaygroundCollapsedLead() {
    const collapsed = useSidebarWidthStore((s) => s.collapsed);
    const toggle = useSidebarWidthStore((s) => s.toggle);

    if (!collapsed) return null;

    return (
        <div className="flex items-center gap-1">
            <TooltipComponent content="Expand sidebar" side="bottom" delayDuration={500}>
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={toggle}
                    aria-label="Expand sidebar"
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                >
                    <TbLayoutSidebarFilled className="size-4" aria-hidden />
                </Button>
            </TooltipComponent>
            <PlaygroundLeadBar />
        </div>
    );
}
