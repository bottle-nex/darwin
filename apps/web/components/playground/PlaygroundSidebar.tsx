"use client";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
    RiLayoutColumnFill,
    RiCodeSSlashFill,
    RiListSettingsFill,
    RiFlashlightFill,
    RiSettingsFill,
    RiInformationFill,
    RiPaletteFill,
    RiTeamFill,
    RiBankCardFill,
    RiShieldKeyholeFill,
} from "react-icons/ri";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    PlayGroundSidebarProps,
    usePlaygroundRenderer,
} from "@/store/playground/usePlaygroundRenderer";
import { cn } from "@/lib/utils";
import PlaygroundSidebarPanel, {
    type SidebarChild,
} from "@/components/playground/PlaygroundSidebarPanel";

type RendererMeta = {
    icon: React.ElementType;
    label: string;
    children?: SidebarChild[];
};

const RENDERER_META: Record<PlayGroundSidebarProps, RendererMeta> = {
    [PlayGroundSidebarProps.KANBAN]: { icon: RiLayoutColumnFill, label: "Kanban" },
    [PlayGroundSidebarProps.CODE]: { icon: RiCodeSSlashFill, label: "Code" },
    [PlayGroundSidebarProps.PROPS]: { icon: RiListSettingsFill, label: "Props" },
    [PlayGroundSidebarProps.EVENTS]: { icon: RiFlashlightFill, label: "Events" },
    [PlayGroundSidebarProps.MANAGE]: {
        icon: RiSettingsFill,
        label: "Manage",
        children: [
            {
                key: "general",
                label: "General",
                description: "Name & metadata",
                icon: RiInformationFill,
            },
            {
                key: "appearance",
                label: "Appearance",
                description: "Theme & layout",
                icon: RiPaletteFill,
            },
            { key: "members", label: "Members", description: "People & roles", icon: RiTeamFill },
            {
                key: "access",
                label: "Access",
                description: "Keys & tokens",
                icon: RiShieldKeyholeFill,
            },
            {
                key: "billing",
                label: "Billing",
                description: "Plan & invoices",
                icon: RiBankCardFill,
            },
        ],
    },
};

const RENDERERS = Object.values(PlayGroundSidebarProps);

export default function PlaygroundSidebar() {
    const renderer = usePlaygroundRenderer((s) => s.renderer);
    const setRenderer = usePlaygroundRenderer((s) => s.setRenderer);
    const [openPanelKey, setOpenPanelKey] = useState<PlayGroundSidebarProps | null>(null);

    const selectRenderer = (key: PlayGroundSidebarProps) => {
        setRenderer(key);
        // Items with children toggle their panel (tapping the open one closes it);
        // items without children switch views and dismiss any open panel.
        setOpenPanelKey((prev) => (RENDERER_META[key].children && prev !== key ? key : null));
    };

    const openPanel = openPanelKey ? RENDERER_META[openPanelKey] : null;

    return (
        <div className="flex h-full shrink-0">
            <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-1 py-3">
                <nav className="flex flex-col items-center gap-1" aria-label="Playground views">
                    {RENDERERS.map((key) => {
                        const { icon: Icon, label, children } = RENDERER_META[key];
                        const isActive = renderer === key;

                        return (
                            <Tooltip key={key}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => selectRenderer(key)}
                                        aria-label={label}
                                        aria-current={isActive ? "true" : undefined}
                                        aria-expanded={
                                            children?.length
                                                ? openPanelKey === key
                                                    ? "true"
                                                    : "false"
                                                : undefined
                                        }
                                        className={cn(
                                            "group relative flex size-10 cursor-pointer items-center justify-center rounded-md outline-none transition-all duration-200 ease-out",
                                            "focus-visible:ring-2 focus-visible:ring-[#9bc24f]/40",
                                            isActive
                                                ? "bg-[#9bc24f]/10 text-[#bcdb6f]"
                                                : "text-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-200",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "absolute -left-2 h-8 w-0.75 rounded-r-full bg-[#9bc24f] transition-all duration-200 ease-out",
                                                isActive
                                                    ? "opacity-100"
                                                    : "-translate-x-1 opacity-0",
                                            )}
                                            aria-hidden
                                        />
                                        <Icon
                                            className={cn(
                                                "size-4.5 transition-transform duration-200 ease-out",
                                                !isActive && "group-hover:scale-110",
                                            )}
                                            aria-hidden
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{label}</TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </aside>

            <AnimatePresence initial={false}>
                {openPanel?.children && (
                    <PlaygroundSidebarPanel
                        key={openPanelKey}
                        label={openPanel.label}
                        items={openPanel.children}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
