"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpCircle, ChevronsRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RAIL_ITEMS, type RailItem } from "./railItems";
import { RailSurface } from "./railSurface";
import AppLogo from "@/components/app/Applogo";

type PlaygroundIconRailProps = {
    activeSurface: RailSurface;
    onSelectSurface: (surface: RailSurface) => void;
    sidebarCollapsed: boolean;
    onExpandSidebar: () => void;
};

export default function PlaygroundIconRail({
    activeSurface,
    onSelectSurface,
    sidebarCollapsed,
    onExpandSidebar,
}: PlaygroundIconRailProps) {
    return (
        <nav
            className="flex w-14 shrink-0 flex-col items-center justify-between rounded-lg bg-charcoal py-1.5 ring-1 ring-white/5"
            aria-label="App"
        >
            <div className="flex w-full flex-col items-center">
                <AnimatePresence initial={false}>
                    {sidebarCollapsed && (
                        <motion.div
                            key="expand"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            className="flex w-full flex-col items-center overflow-hidden"
                        >
                            <div className="mb-2 flex w-full flex-col items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onExpandSidebar}
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                                    aria-label="Expand sidebar"
                                >
                                    <ChevronsRight className="size-4" aria-hidden />
                                </button>
                                <div className="h-px w-8 bg-white/10" aria-hidden />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ul className="flex w-full flex-col items-center gap-0.5">
                    {RAIL_ITEMS.map((item) => (
                        <li key={item.surface} className="w-full px-1">
                            <RailButton
                                item={item}
                                active={item.surface === activeSurface}
                                onClick={() => onSelectSurface(item.surface)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex w-full flex-col items-center gap-1 px-1">
                <FooterButton icon={<UserPlus className="size-4" />} label="Invite" />
                <FooterButton icon={<ArrowUpCircle className="size-4" />} label="Pro" />
            </div>
        </nav>
    );
}

function RailButton({
    item,
    active,
    onClick,
}: {
    item: RailItem;
    active: boolean;
    onClick: () => void;
}) {
    const { Icon } = item;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full cursor-pointer flex-col items-center gap-px rounded-md px-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-200",
            )}
        >
            <span
                className={cn(
                    "relative flex size-7 items-center justify-center",
                    active && "text-neutral-100",
                )}
            >
                <Icon className="size-4" aria-hidden />
                {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
                        {item.badge}
                    </span>
                )}
            </span>
            <span className="truncate">{item.label}</span>
        </button>
    );
}

function FooterButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            className="group flex w-full cursor-pointer flex-col items-center rounded-md px-1 py-1.5 text-[10px] font-medium text-neutral-500 transition-colors hover:text-neutral-200"
        >
            <span className="flex size-7 items-center justify-center">{icon}</span>
            <span>{label}</span>
        </button>
    );
}
