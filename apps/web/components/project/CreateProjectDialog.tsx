"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useSetProjectSecrets } from "@/hooks/project/useSetProjectSecrets";
import ProjectEnvStep, { type EnvRow } from "@/components/project/ProjectEnvStep";
import CreateProjectDialogDetailsStep from "@/components/project/CreateProjectDialogDetailsStep";

export const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

export const SURFACE = "rounded-lg bg-white/5 shadow-[inset_0_1px_0_0_var(--color-edge)]";

export default function CreateProjectDialog() {
    const { open, setOpen, targetOrgSlug, setTargetOrgSlug, forceCreate, setForceCreate } =
        useNewProjectStore();
    const { orgSlug: orgSlugParam } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    const orgSlug = targetOrgSlug ?? (typeof orgSlugParam === "string" ? orgSlugParam : "");
    const org = (organizations ?? []).find((o) => o.slug === orgSlug);
    const { data: dashboard } = useGetDashboard(org?.slug);

    const setSecrets = useSetProjectSecrets();

    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [envRows, setEnvRows] = useState<EnvRow[]>([{ key: "", value: "" }]);
    const [revealValues, setRevealValues] = useState(false);

    const mustCreateProject =
        open && !!org && forceCreate && dashboard?.projects.length === 0 && !createdProjectId;

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            setTargetOrgSlug(null);
            setForceCreate(false);
            setCreatedProjectId(null);
            setEnvRows([{ key: "", value: "" }]);
            setRevealValues(false);
            setSecrets.reset();
        }
    }

    function handleSaveSecrets() {
        if (!createdProjectId) return;
        const valid = envRows
            .filter((row) => row.key.trim() && row.value)
            .map((row) => ({ key: row.key.trim(), value: row.value }));
        if (!valid.length) {
            handleOpenChange(false);
            return;
        }
        setSecrets.mutate(
            { projectId: createdProjectId, secrets: valid },
            { onSuccess: () => handleOpenChange(false) },
        );
    }

    const hasValidSecrets = envRows.some((row) => row.key.trim() && row.value);

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
                    "bg-charcoal rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">
                    {createdProjectId ? "Environment variables" : "Create project"}
                </DialogTitle>

                {createdProjectId ? (
                    <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
                        <section
                            data-lenis-prevent
                            className="no-scrollbar flex-1 min-h-0 overflow-y-auto pt-4"
                        >
                            <ProjectEnvStep
                                rows={envRows}
                                setRows={setEnvRows}
                                reveal={revealValues}
                                setReveal={setRevealValues}
                            />
                        </section>
                        <section className="flex h-fit items-center justify-end gap-x-2 pb-4">
                            <Button
                                type="button"
                                variant="unstyled"
                                size="xs"
                                disabled={setSecrets.isPending}
                                onClick={() => handleOpenChange(false)}
                                className="cursor-pointer px-2 text-xs text-white/50 hover:text-white/80"
                            >
                                Skip for now
                            </Button>
                            <Button
                                type="button"
                                variant="tertiary"
                                size="xs"
                                className="text-ink!"
                                loading={setSecrets.isPending}
                                disabled={!hasValidSecrets || setSecrets.isPending}
                                onClick={handleSaveSecrets}
                            >
                                Save &amp; finish
                            </Button>
                        </section>
                    </main>
                ) : (
                    <CreateProjectDialogDetailsStep
                        org={org}
                        mustCreateProject={mustCreateProject}
                        onCancel={() =>
                            mustCreateProject
                                ? signOut({ callbackUrl: "/" })
                                : handleOpenChange(false)
                        }
                        onCreated={setCreatedProjectId}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
