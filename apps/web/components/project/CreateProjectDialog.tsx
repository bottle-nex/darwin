"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { isAxiosError } from "axios";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/format";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useCreateProject } from "@/hooks/project/useCreateProject";
import { useSetProjectSecrets } from "@/hooks/project/useSetProjectSecrets";
import ProjectEnvStep, { type EnvRow } from "@/components/project/ProjectEnvStep";
import CreateProjectDialogDetailsStep, {
    type FormValues,
} from "@/components/project/CreateProjectDialogDetailsStep";
import type { GithubRepo } from "@/types/organization";

const FORM_ID = "create-project-form";

export const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

export const SURFACE = "rounded-lg bg-white/5 shadow-[inset_0_1px_0_0_var(--color-edge)]";

const HEADER_COPY = {
    details: {
        title: "Create project",
        description:
            "Projects hold the repos your runners clone and the issues your agents pick up.",
    },
    env: {
        title: "Environment variables",
        description:
            "Add the secrets your project needs to build and run. Optional — you can skip and add them later.",
    },
} as const;

export default function CreateProjectDialog() {
    const { open, setOpen, targetOrgSlug, setTargetOrgSlug } = useNewProjectStore();
    const { orgSlug: orgSlugParam } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    const orgSlug = targetOrgSlug ?? (typeof orgSlugParam === "string" ? orgSlugParam : "");
    const org = (organizations ?? []).find((o) => o.slug === orgSlug);

    const createProject = useCreateProject();
    const setSecrets = useSetProjectSecrets();

    const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [step, setStep] = useState<"details" | "env">("details");
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [envRows, setEnvRows] = useState<EnvRow[]>([{ key: "", value: "" }]);
    const [revealValues, setRevealValues] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { name: "", slug: "", description: "" },
    });

    const name = useWatch({ control, name: "name" });
    const detailsReady = Boolean(name?.trim());

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            reset();
            setSelectedRepo(null);
            setSelectedBranch("");
            setTargetOrgSlug(null);
            setStep("details");
            setCreatedProjectId(null);
            setEnvRows([{ key: "", value: "" }]);
            setRevealValues(false);
            createProject.reset();
            setSecrets.reset();
        }
    }

    const onSubmit = handleSubmit((values) => {
        if (!org) return;
        const trimmed = values.name.trim();
        const projectSlug = values.slug.trim() || slugify(trimmed);
        const desc = values.description.trim();

        createProject.mutate(
            {
                org_id: org.id,
                name: trimmed,
                slug: projectSlug,
                description: desc || undefined,
                repo: selectedRepo
                    ? {
                          githubRepoId: selectedRepo.id,
                          fullName: selectedRepo.fullName,
                          htmlUrl: selectedRepo.htmlUrl,
                          defaultBranch: selectedBranch || selectedRepo.defaultBranch,
                      }
                    : undefined,
            },
            {
                onSuccess: (project) => {
                    setCreatedProjectId(project.id);
                    setStep("env");
                },
            },
        );
    });

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

    const slugTaken =
        isAxiosError(createProject.error) &&
        createProject.error.response?.data?.error?.code === "SLUG_TAKEN";

    function renderActions() {
        switch (step) {
            case "details":
                return (
                    <>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
                            disabled={createProject.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form={FORM_ID}
                            size="sm"
                            loading={createProject.isPending}
                            disabled={!detailsReady || !org || createProject.isPending}
                        >
                            Create Project
                        </Button>
                    </>
                );
            case "env":
                return (
                    <>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            disabled={setSecrets.isPending}
                            onClick={() => handleOpenChange(false)}
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            loading={setSecrets.isPending}
                            disabled={!hasValidSecrets || setSecrets.isPending}
                            onClick={handleSaveSecrets}
                        >
                            Save &amp; finish
                        </Button>
                    </>
                );
        }
    }

    function renderStep() {
        switch (step) {
            case "env":
                return (
                    <ProjectEnvStep
                        rows={envRows}
                        setRows={setEnvRows}
                        reveal={revealValues}
                        setReveal={setRevealValues}
                    />
                );
            case "details":
                return (
                    <CreateProjectDialogDetailsStep
                        formId={FORM_ID}
                        onSubmit={onSubmit}
                        register={register}
                        control={control}
                        setValue={setValue}
                        errors={errors}
                        slugTaken={slugTaken}
                        org={org}
                        detailsReady={detailsReady}
                        selectedRepo={selectedRepo}
                        setSelectedRepo={setSelectedRepo}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                    />
                );
        }
    }

    const copy = HEADER_COPY[step];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="gap-0 overflow-hidden border-white/10 bg-charcoal p-0 sm:max-w-3xl"
            >
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-base text-neutral-100">
                            {copy.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            {copy.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex shrink-0 items-center gap-2">{renderActions()}</div>
                </div>

                {renderStep()}
            </DialogContent>
        </Dialog>
    );
}
