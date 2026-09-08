"use client";
import { OptionsMenuIcon } from "@trydarwin/ui/icons";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconWrapper from "@/components/ui/IconWrapper";
import { useUpdateUserConfig } from "@/hooks/user/useUpdateUserConfig";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { DIFF_VIEWS } from "@/lib/review/diffView";
import { cn } from "@/lib/utils";

export default function DiffViewMenu() {
    const { diffView } = useUserConfig();
    const updateConfig = useUpdateUserConfig();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Display" className="group cursor-pointer">
                    <IconWrapper icon={OptionsMenuIcon} variant="ring" title="Display" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Display</DropdownMenuLabel>
                <div role="tablist" aria-label="Diff view" className="flex items-center gap-1 p-1">
                    {DIFF_VIEWS.map((view) => (
                        <Button
                            key={view.value}
                            variant="unstyled"
                            type="button"
                            role="tab"
                            aria-selected={diffView === view.value}
                            onClick={() => updateConfig.mutate({ diffView: view.value })}
                            className={cn(
                                "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xs px-1 py-1 text-[13.5px] font-medium transition-colors",
                                diffView === view.value
                                    ? "text-snow"
                                    : "text-neutral-500 hover:text-neutral-300",
                            )}
                        >
                            {diffView === view.value && (
                                <motion.div
                                    layoutId="diff-view-tab-bg"
                                    className="absolute inset-0 rounded-full border border-snow/5 bg-snow/4 shadow-sm shadow-black/7"
                                    transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                                />
                            )}
                            <view.icon className="relative size-3.5" aria-hidden />
                            <span className="relative">{view.label}</span>
                        </Button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
