"use client";
import { useState } from "react";
import { MdAdd, MdVpnKey } from "react-icons/md";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useProjectSecrets } from "@/hooks/project/useProjectSecrets";
import { useSetProjectSecrets } from "@/hooks/project/useSetProjectSecrets";
import { Button } from "@/components/ui/button";
import ProjectEnvStep, { type EnvRow } from "@/components/project/ProjectEnvStep";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Unused — HomeTab.SettingsEnv actually renders SettingsDisplay/ProjectSettingsView instead.
export default function EnvironmentDisplay() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

    const { data: secrets, isLoading, isError } = useProjectSecrets(activeProject?.id);
    const setSecrets = useSetProjectSecrets();

    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<EnvRow[]>([{ key: "", value: "" }]);
    const [reveal, setReveal] = useState(false);

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            setRows([{ key: "", value: "" }]);
            setReveal(false);
            setSecrets.reset();
        }
    }

    function handleSave() {
        if (!activeProject?.id) return;
        const valid = rows.filter((r) => r.key.trim() && r.value.trim());
        if (!valid.length) return;
        setSecrets.mutate(
            { projectId: activeProject.id, secrets: valid },
            {
                onSuccess: () => {
                    toast.success("Environment variables saved.");
                    handleOpenChange(false);
                },
                onError: () => toast.error("Couldn't save environment variables."),
            },
        );
    }

    const hasValid = rows.some((r) => r.key.trim() && r.value.trim());

    return (
        <section className="h-full rounded-xl ring-1 ring-white/5 bg-charcoal p-3 m-5 ">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                    <MdVpnKey className="size-4 text-neutral-400" aria-hidden />
                    <h3 className="text-[15px] font-medium text-neutral-100">
                        Environment Variables
                    </h3>
                    <span className="text-[13px] text-neutral-500">({secrets?.length ?? 0})</span>
                </div>

                <Button size="sm" variant={"tertiary"} onClick={() => setOpen(true)}>
                    <MdAdd className="size-3.5" />
                    Add variable
                </Button>
            </div>

            <div className="h-full mt-5 flex flex-col gap-2.25">
                {isLoading ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="h-10.5 animate-pulse rounded-lg bg-white/5" />
                    ))
                ) : isError ? (
                    <p className="px-1 py-2 text-[12px] text-red-400">
                        Couldn&apos;t load environment variables.
                    </p>
                ) : !secrets?.length ? (
                    <div className="h-full flex flex-col justify-center ">
                        <PaneEmptyState
                            icon={MdVpnKey}
                            title="No environment variables"
                            subtitle="Add the secrets your project needs to build and run."
                        />
                    </div>
                ) : (
                    secrets.map((secret) => (
                        <div
                            key={secret.key}
                            className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5"
                        >
                            <MdVpnKey className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
                            <span className="font-mono text-[13px] text-neutral-200">
                                {secret.key}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    showCloseButton={false}
                    className="gap-0 overflow-hidden border-white/10 bg-charcoal p-0 sm:max-w-3xl"
                >
                    <div className="flex items-start justify-between gap-4 px-5 py-4">
                        <DialogHeader className="gap-1">
                            <DialogTitle className="text-base text-neutral-100">
                                Environment variables
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500">
                                Add the secrets your project needs to build and run. Optional — you
                                can skip and add them later.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="tertiary"
                                size="sm"
                                disabled={setSecrets.isPending}
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                loading={setSecrets.isPending}
                                disabled={!hasValid || setSecrets.isPending}
                                onClick={handleSave}
                            >
                                Save &amp; finish
                            </Button>
                        </div>
                    </div>

                    <ProjectEnvStep
                        rows={rows}
                        setRows={setRows}
                        reveal={reveal}
                        setReveal={setReveal}
                    />
                </DialogContent>
            </Dialog>
        </section>
    );
}
