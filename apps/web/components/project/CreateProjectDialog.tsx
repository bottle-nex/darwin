"use client";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";
import { useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import CreateProjectDialogDetailsStep from "@/components/project/CreateProjectDialogDetailsStep";
import {
    Dialog,
    DIALOG_COMPOSER_SURFACE,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { type IconPick, IconPickButton } from "@/components/ui/IconPicker";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { cn } from "@/lib/utils";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";

export const FIELD =
    "mt-1.5 border-overlay/10 bg-overlay/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

export const SURFACE = "rounded-lg bg-overlay/5 shadow-[inset_0_1px_0_0_var(--color-edge)]";

export default function CreateProjectDialog() {
    const { open, setOpen, targetOrgSlug, setTargetOrgSlug, forceCreate, setForceCreate } =
        useNewProjectStore();
    const { orgSlug: orgSlugParam } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    const orgSlug = targetOrgSlug ?? (typeof orgSlugParam === "string" ? orgSlugParam : "");
    const org = (organizations ?? []).find((o) => o.slug === orgSlug);
    const { data: dashboard } = useGetDashboard(org?.slug);

    const [icon, setIcon] = useState<IconPick | null>(null);
    const [iconOpen, setIconOpen] = useState(false);

    const mustCreateProject = open && !!org && forceCreate && dashboard?.projects.length === 0;

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            setTargetOrgSlug(null);
            setForceCreate(false);
            setIcon(null);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && mustCreateProject) return;
                handleOpenChange(next);
            }}
        >
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-187.5 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    DIALOG_COMPOSER_SURFACE,
                )}
            >
                <DialogTitle className="sr-only">Create project</DialogTitle>

                <section className="flex items-center gap-x-1 px-6 pt-4 pb-2 text-xs text-overlay">
                    <PlaygroundAvatar
                        letter={org?.name.slice(0, 2) ?? ""}
                        tone="emerald"
                        className="uppercase"
                    />
                    <span>
                        <BreadcrumbSeparatorIcon />
                    </span>
                    <IconPickButton
                        pick={icon}
                        onSelect={setIcon}
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        label="Pick project icon"
                        size="sm"
                    />
                    <span>
                        <BreadcrumbSeparatorIcon />
                    </span>
                    <span className="text-sm">New Project</span>
                </section>

                <CreateProjectDialogDetailsStep
                    org={org}
                    icon={icon}
                    mustCreateProject={mustCreateProject}
                    onCancel={() =>
                        mustCreateProject ? signOut({ callbackUrl: "/" }) : handleOpenChange(false)
                    }
                    onCreated={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
