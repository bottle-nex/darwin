"use client";

import { useState } from "react";
import {
    RiNotification3Fill,
    RiDashboardFill,
    RiInboxFill,
    RiCalendarFill,
    RiClipboardFill,
    RiInformationFill,
    RiSettings4Fill,
} from "react-icons/ri";
import { BsFillKanbanFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import IconWrapper from "../ui/IconWrapper";
import { PiBuildingOfficeFill } from "react-icons/pi";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
} from "@/components/ui/select";

type NavItem = {
    label: string;
    icon: React.ElementType;
};

type Org = {
    id: string;
    name: string;
};

const ORGS: Org[] = [
    { id: "appx", name: "AppX" },
    { id: "northwind", name: "Northwind Labs" },
    { id: "acme", name: "Acme Corp" },
    { id: "globex", name: "Globex" },
    { id: "umbrella", name: "Umbrella Inc" },
];

const PRIMARY_ITEMS: NavItem[] = [
    { label: "Kanban", icon: BsFillKanbanFill },
    { label: "Notification", icon: RiNotification3Fill },
    { label: "Dashboard", icon: RiDashboardFill },
];

const WORKSPACE_ITEMS: NavItem[] = [
    { label: "Inbox", icon: RiInboxFill },
    { label: "Calendar", icon: RiCalendarFill },
    { label: "Reports", icon: RiClipboardFill },
    { label: "Help & Center", icon: RiInformationFill },
    { label: "Settings", icon: RiSettings4Fill },
];

export default function PlaygroundSidebar() {
    const [active, setActive] = useState("Project");
    const [orgId, setOrgId] = useState("appx");
    const activeOrg = ORGS.find((o) => o.id === orgId) ?? ORGS[0];

    const renderItem = ({ label, icon: Icon }: NavItem) => {
        const isActive = active === label;

        return (
            <button
                key={label}
                type="button"
                onClick={() => setActive(label)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-[12px] outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-neutral-500/40",
                    isActive
                        ? "bg-[#1a1a1a] text-white shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.06)]"
                        : "text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-200",
                )}
            >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{label}</span>
            </button>
        );
    };

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col px-3">
            <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger
                    aria-label="Switch organization"
                    className="h-auto w-full justify-between gap-x-3 border-0 bg-transparent px-2 py-4 text-[12px] text-neutral-300 shadow-none hover:bg-neutral-800/50 focus-visible:ring-0 data-[size=default]:h-auto"
                >
                    <span className="flex min-w-0 items-center gap-x-3">
                        <IconWrapper
                            icon={<PiBuildingOfficeFill />}
                            stroke_color="text-indigo-200"
                            bg_color="bg-indigo-700"
                        />
                        <span className="truncate">{activeOrg.name}</span>
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Organizations</SelectLabel>
                        {ORGS.map((org) => (
                            <SelectItem key={org.id} value={org.id} className="py-2 pl-2">
                                <span className="flex items-center gap-x-3">
                                    <IconWrapper
                                        icon={<PiBuildingOfficeFill />}
                                        stroke_color="text-indigo-200"
                                        bg_color="bg-indigo-700"
                                    />
                                    <span className="truncate">{org.name}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            <div className="mx-2 h-px bg-neutral-800" />

            <nav className="flex flex-col gap-1 py-3" aria-label="Primary">
                {PRIMARY_ITEMS.map(renderItem)}
            </nav>

            <div className="mx-2 h-px bg-neutral-800" />

            <nav className="flex flex-col gap-1 py-3" aria-label="Workspace">
                {WORKSPACE_ITEMS.map(renderItem)}
            </nav>
        </aside>
    );
}
