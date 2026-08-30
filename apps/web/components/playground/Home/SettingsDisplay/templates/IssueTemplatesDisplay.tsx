"use client";

import { AddIcon, DeleteIcon, EditIcon, TemplateDocumentIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useDeleteTemplate } from "@/hooks/templates/useDeleteTemplate";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useUpdateTemplate } from "@/hooks/templates/useUpdateTemplate";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { IssueTemplate } from "@/types/issueTemplate";

import SettingsRow from "../SettingsRow";
import SettingsUtilityCard from "../SettingsUtilityCard";
import CreateTemplateDisplay from "./CreateTemplateDisplay";

type View = { kind: "list" } | { kind: "edit"; template?: IssueTemplate };

const ROW_ICON_BUTTON =
    "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-snow/8 text-neutral-400 transition-colors hover:bg-snow/12 hover:text-neutral-200 disabled:opacity-40 [&_svg]:size-3.5";

export default function IssueTemplatesDisplay({ projectId }: { projectId: string | undefined }) {
    const templates = useListTemplates(projectId);
    const updateTemplate = useUpdateTemplate();
    const deleteTemplate = useDeleteTemplate();

    const [view, setView] = useState<View>({ kind: "list" });
    const [confirmDelete, setConfirmDelete] = useState<IssueTemplate | null>(null);

    if (view.kind === "edit" && projectId) {
        return (
            <CreateTemplateDisplay
                key={view.template?.id ?? "new"}
                projectId={projectId}
                template={view.template}
                onDone={() => setView({ kind: "list" })}
            />
        );
    }

    function makeDefault(template: IssueTemplate) {
        if (!projectId) return;
        updateTemplate.mutate(
            { projectId, templateId: template.id, isDefault: true },
            {
                onSuccess: () => toast.success(`"${template.name}" is now the default.`),
                onError: () => toast.error("Couldn't set the default."),
            },
        );
    }

    function removeTemplate(template: IssueTemplate) {
        if (!projectId) return;
        deleteTemplate.mutate(
            { projectId, templateId: template.id },
            {
                onSuccess: () => {
                    toast.success("Template deleted.");
                    setConfirmDelete(null);
                },
                onError: () => toast.error("Couldn't delete the template."),
            },
        );
    }

    const list = templates.data ?? [];

    return (
        <SettingsUtilityCard
            title="Issue templates"
            headerAction={
                <Button
                    type="button"
                    size="sm"
                    variant="flat"
                    disabled={!projectId}
                    onClick={() => setView({ kind: "edit" })}
                >
                    <AddIcon className="size-3" aria-hidden />
                    New template
                </Button>
            }
            rows
        >
            {templates.isLoading ? (
                <div className="px-5 py-4 text-[13px] text-neutral-500">Loading…</div>
            ) : list.length === 0 ? (
                <div className="px-5 py-4 text-[13px] text-neutral-500">
                    No issue templates yet.
                </div>
            ) : (
                <>
                    {list.map((template) => {
                        const deleting =
                            deleteTemplate.isPending &&
                            deleteTemplate.variables?.templateId === template.id;
                        const defaulting =
                            updateTemplate.isPending &&
                            updateTemplate.variables?.templateId === template.id;
                        return (
                            <SettingsRow
                                key={template.id}
                                className="group"
                                label={
                                    <span className="flex items-center gap-2">
                                        {template.icon ? (
                                            <IconPickGlyph
                                                pick={template.icon}
                                                className="size-3.5 shrink-0 text-sm"
                                            />
                                        ) : (
                                            <TemplateDocumentIcon
                                                className="size-3.5 shrink-0 text-white/35"
                                                aria-hidden
                                            />
                                        )}
                                        <span className="truncate">{template.name}</span>
                                        {template.isDefault && (
                                            <span className="shrink-0 rounded-full bg-matcha/10 px-2 py-0.5 text-[10px] text-matcha">
                                                Default
                                            </span>
                                        )}
                                    </span>
                                }
                            >
                                <menu className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                    {!template.isDefault && (
                                        <Button
                                            type="button"
                                            variant="flat"
                                            size="sm"
                                            loading={defaulting}
                                            onClick={() => makeDefault(template)}
                                            className="hover:text-matcha"
                                        >
                                            Set as default
                                        </Button>
                                    )}
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label={`Edit ${template.name}`}
                                        onClick={() => setView({ kind: "edit", template })}
                                        className={ROW_ICON_BUTTON}
                                    >
                                        <EditIcon className="size-3.5" aria-hidden />
                                    </Button>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label={`Delete ${template.name}`}
                                        loading={deleting}
                                        iconOnly
                                        onClick={() => setConfirmDelete(template)}
                                        className={cn(
                                            ROW_ICON_BUTTON,
                                            "hover:bg-red-500/12 hover:text-red-300",
                                        )}
                                    >
                                        <DeleteIcon className="size-3.5" aria-hidden />
                                    </Button>
                                </menu>
                            </SettingsRow>
                        );
                    })}
                </>
            )}

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onOpenChange={(next) => !next && setConfirmDelete(null)}
                title="Delete template?"
                description={`"${confirmDelete?.name}" will no longer be offered when someone files an issue. Issues already filed with it keep their description.`}
                cancel={{
                    label: "Cancel",
                    variant: "outline",
                    onClick: () => setConfirmDelete(null),
                }}
                confirm={{
                    label: "Delete",
                    variant: "destructive",
                    onClick: () => confirmDelete && removeTemplate(confirmDelete),
                }}
                pending={deleteTemplate.isPending}
            />
        </SettingsUtilityCard>
    );
}
