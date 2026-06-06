import type { LucideIcon } from "lucide-react";
import { CircleAlert, SquareCheckBig, Zap } from "lucide-react";

export type TeamStat = {
    id: string;
    label: string;
    value: string;
    unit: string;
    caption: string;
    trend: string;
    icon: LucideIcon;
};

export const TEAM_STATS: TeamStat[] = [
    {
        id: "total",
        label: "Total Members",
        value: "12",
        unit: "members",
        caption: "All registered users",
        trend: "12% from last month",
        icon: Zap,
    },
    {
        id: "admins",
        label: "Total Admins",
        value: "4",
        unit: "admin",
        caption: "Waiting for approval",
        trend: "+4% from last week",
        icon: SquareCheckBig,
    },
    {
        id: "active",
        label: "Active This Week",
        value: "08",
        unit: "members",
        caption: "Logged in past 7 days",
        trend: "+8% from last week",
        icon: CircleAlert,
    },
    {
        id: "pending",
        label: "Pending Invites",
        value: "02",
        unit: "members",
        caption: "Invitations sent",
        trend: "-2 from last week",
        icon: CircleAlert,
    },
];
