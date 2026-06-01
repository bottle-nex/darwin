"use client";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
    RiLayoutColumnFill,
    RiCodeSSlashFill,
    RiEqualizer2Fill,
    RiPulseFill,
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
import IconWrapper from "@/components/ui/IconWrapper";
import PlaygroundSidebarPanel, {
    type SidebarChild,
} from "@/components/playground/PlaygroundSidebarPanel";

type RendererMeta = {
    icon: React.ElementType;
    label: string;
    bgColor: string;
    strokeColor: string;
    children?: SidebarChild[];
};

const RENDERER_META: Record<PlayGroundSidebarProps, RendererMeta> = {
    [PlayGroundSidebarProps.KANBAN]: {
        icon: RiLayoutColumnFill,
        label: "Kanban",
        bgColor: "bg-indigo-500",
        strokeColor: "text-white",
    },
    [PlayGroundSidebarProps.CODE]: {
        icon: RiCodeSSlashFill,
        label: "Code",
        bgColor: "bg-emerald-500",
        strokeColor: "text-white",
    },
    [PlayGroundSidebarProps.PROPS]: {
        icon: RiEqualizer2Fill,
        label: "Props",
        bgColor: "bg-amber-500",
        strokeColor: "text-white",
    },
    [PlayGroundSidebarProps.EVENTS]: {
        icon: RiPulseFill,
        label: "Events",
        bgColor: "bg-sky-500",
        strokeColor: "text-white",
    },
    [PlayGroundSidebarProps.MANAGE]: {
        icon: RiSettingsFill,
        label: "Manage",
        bgColor: "bg-rose-500",
        strokeColor: "text-white",
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
                        const {
                            icon: Icon,
                            label,
                            children,
                            bgColor,
                            strokeColor,
                        } = RENDERER_META[key];
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
                                                ? "bg-neutral-800/80"
                                                : "hover:bg-neutral-800/60",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                bgColor,
                                                "absolute -left-2 h-8 w-0.75 rounded-r-full transition-all duration-200 ease-out",
                                                isActive
                                                    ? "opacity-100"
                                                    : "-translate-x-1 opacity-0",
                                            )}
                                            aria-hidden
                                        />
                                        <IconWrapper
                                            icon={<Icon className="size-3.5" aria-hidden />}
                                            stroke_color={strokeColor}
                                            bg_color={bgColor}
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
