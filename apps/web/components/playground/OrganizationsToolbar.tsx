"use client";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoAddSharp } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { OrgRole } from "@/types/organization";

export type RoleFilter = "All" | OrgRole;

const ROLE_OPTIONS: RoleFilter[] = ["All", "Owner", "Admin", "Member", "Billing"];

const FIELD =
    "border-white/10 bg-white/5 text-[13px] text-neutral-300 hover:bg-white/7 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

export default function OrganizationsToolbar({
    search,
    onSearch,
    role,
    onRole,
    onCreate,
}: {
    search: string;
    onSearch: (value: string) => void;
    role: RoleFilter;
    onRole: (value: RoleFilter) => void;
    onCreate: () => void;
}) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
                <FaMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500" />
                <Input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search organizations…"
                    className={`pl-9 placeholder:text-neutral-500 ${FIELD}`}
                />
            </div>

            <div className="flex items-center gap-2">
                <Select value={role} onValueChange={(v) => onRole(v as RoleFilter)}>
                    <SelectTrigger aria-label="Filter by role" className={`min-w-32.5 ${FIELD}`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark">
                        {ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                                {option === "All" ? "All roles" : option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button onClick={onCreate}>
                    <IoAddSharp className="size-3" />
                    Create Org
                </Button>
            </div>
        </div>
    );
}
