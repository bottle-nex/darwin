"use client";
import {
    AddIcon,
    DeleteIcon,
    EnvSecretIcon,
    HideSecretIcon,
    ImportUploadIcon,
    RevealSecretIcon,
} from "@trydarwin/ui/icons";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteProjectSecret } from "@/hooks/project/useDeleteProjectSecret";
import { useProjectSecrets } from "@/hooks/project/useProjectSecrets";
import { useSetProjectSecrets } from "@/hooks/project/useSetProjectSecrets";
import parse_env from "@/lib/env_parser";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import SettingsRow from "./SettingsRow";
import SettingsUtilityCard from "./SettingsUtilityCard";

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Secret values are write-only and never returned, so render a masked placeholder.
 * Length is derived from the key (stable across renders) so it varies per row but
 * never flickers, between a clean 8–18 dots.
 */
function maskDots(key: string) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
    const length = 8 + (Math.abs(hash) % 11);
    return "•".repeat(length);
}

/** Environment-variables settings section. Values are write-only over the wire. */
export default function ProjectSettingsEnvSection({
    projectId,
}: {
    projectId: string | undefined;
}) {
    const secrets = useProjectSecrets(projectId);
    const setSecrets = useSetProjectSecrets();
    const deleteSecret = useDeleteProjectSecret();

    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [reveal, setReveal] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    async function importFile(file: File) {
        if (!projectId) return;
        const pairs = parse_env(await file.text());
        if (pairs.length) setSecrets.mutate({ projectId, secrets: pairs });
    }

    const trimmedKey = newKey.trim();
    const keyValid = KEY_PATTERN.test(trimmedKey);
    const canAdd = Boolean(projectId) && keyValid && newValue.length > 0 && !setSecrets.isPending;

    function addSecret() {
        if (!projectId || !canAdd) return;
        setSecrets.mutate(
            { projectId, secrets: [{ key: trimmedKey, value: newValue }] },
            {
                onSuccess: () => {
                    setNewKey("");
                    setNewValue("");
                },
            },
        );
    }

    const list = secrets.data ?? [];

    return (
        <SettingsUtilityCard
            title="Environment variables"
            headerAction={
                <>
                    <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        loading={setSecrets.isPending}
                        disabled={!projectId}
                        onClick={() => fileRef.current?.click()}
                    >
                        <ImportUploadIcon className="size-3" aria-hidden />
                        Import .env
                    </Button>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void importFile(file);
                            e.target.value = "";
                        }}
                    />
                </>
            }
            rows
        >
            <SettingsRow
                label="Add variable"
                description={
                    newKey.length > 0 && !keyValid ? (
                        <span className="text-red-400">
                            Keys must start with a letter or underscore and contain only letters,
                            numbers, and underscores.
                        </span>
                    ) : (
                        "Encrypted at rest and write-only — adding an existing key overwrites its value, and values are never shown again."
                    )
                }
                stack
            >
                <div className="flex items-center gap-2">
                    <Input
                        variant="outline"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value.replace(/\s/g, ""))}
                        placeholder="DATABASE_URL"
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        spellCheck={false}
                        className="h-8 flex-1 font-mono text-[13px]"
                    />
                    <div className="relative flex-1">
                        <Input
                            variant="outline"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && canAdd) addSecret();
                            }}
                            type="text"
                            placeholder="value"
                            autoComplete="off"
                            data-1p-ignore
                            data-lpignore="true"
                            spellCheck={false}
                            className={cn(
                                "h-8 pr-8 font-mono text-[13px]",
                                !reveal && "[-webkit-text-security:disc]",
                            )}
                        />
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => setReveal((v) => !v)}
                            aria-label={reveal ? "Hide value" : "Show value"}
                            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-neutral-300"
                        >
                            {reveal ? (
                                <HideSecretIcon className="size-3" aria-hidden />
                            ) : (
                                <RevealSecretIcon className="size-3" aria-hidden />
                            )}
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="flat-primary"
                        size="sm"
                        className="h-8 shrink-0"
                        loading={setSecrets.isPending}
                        disabled={!canAdd}
                        onClick={addSecret}
                    >
                        <AddIcon className="size-3" aria-hidden />
                        Add
                    </Button>
                </div>
            </SettingsRow>

            {secrets.isLoading ? (
                <div className="px-5 py-4 text-[13px] text-neutral-500">Loading…</div>
            ) : list.length === 0 ? (
                <div className="px-5 py-4 text-[13px] text-neutral-500">
                    No environment variables yet.
                </div>
            ) : (
                <>
                    {list.map((s) => {
                        const deleting =
                            deleteSecret.isPending && deleteSecret.variables?.key === s.key;
                        return (
                            <SettingsRow
                                key={s.key}
                                label={
                                    <span className="flex items-center gap-2">
                                        <EnvSecretIcon
                                            className="size-3.5 shrink-0 text-neutral-500"
                                            aria-hidden
                                        />
                                        <span className="truncate font-mono">{s.key}</span>
                                    </span>
                                }
                                description={<span className="font-mono">{maskDots(s.key)}</span>}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="shrink-0 text-[11px] text-neutral-500">
                                        Updated {formatRelativeTime(s.updatedAt)}
                                    </span>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label={`Delete ${s.key}`}
                                        loading={deleting}
                                        iconOnly
                                        onClick={() =>
                                            projectId &&
                                            deleteSecret.mutate({ projectId, key: s.key })
                                        }
                                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-snow/8 text-neutral-400 transition-colors hover:bg-red-500/12 hover:text-red-300 disabled:opacity-40 [&_svg]:size-3.5"
                                    >
                                        <DeleteIcon className="size-3.5" aria-hidden />
                                    </Button>
                                </div>
                            </SettingsRow>
                        );
                    })}
                </>
            )}
        </SettingsUtilityCard>
    );
}
