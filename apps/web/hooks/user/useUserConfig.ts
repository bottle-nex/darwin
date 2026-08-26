"use client";
import { useParams } from "next/navigation";

import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { DEFAULT_USER_CONFIG } from "@/lib/backgroundLighting";
import type { UserConfig } from "@/types/project";

export function useUserConfig(): UserConfig {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    return dashboard?.userConfig ?? DEFAULT_USER_CONFIG;
}
