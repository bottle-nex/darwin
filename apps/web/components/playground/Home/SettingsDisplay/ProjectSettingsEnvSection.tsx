"use client";
import { useRef, useState } from "react";
import { MdAdd, MdDelete, MdUpload, MdVisibility, MdVisibilityOff, MdVpnKey } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import parse_env from "@/lib/env_parser";
import { useProjectSecrets } from "@/hooks/project/useProjectSecrets";
import { useSetProjectSecrets } from "@/hooks/project/useSetProjectSecrets";
import { useDeleteProjectSecret } from "@/hooks/project/useDeleteProjectSecret";

const FIELD =
    "border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

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
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[13px] font-semibold text-neutral-100">
                        Environment variables
                    </h2>
                    <p className="mt-1 text-[12px] text-neutral-500">
                        Encrypted at rest and write-only, you can add, overwrite, or delete them,
                        but they&rsquo;re never shown again.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    loading={setSecrets.isPending}
                    disabled={!projectId}
                    onClick={() => fileRef.current?.click()}
                >
                    <MdUpload className="size-3" aria-hidden />
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
            </div>

            {/* Add / overwrite */}
            <div className="rounded-lg bg-white/5 p-3 shadow-[inset_0_1px_0_0_#262626]">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-[11px] text-neutral-500">Key</label>
                        <Input
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.replace(/\s/g, ""))}
                            placeholder="DATABASE_URL"
                            autoComplete="off"
                            data-1p-ignore
                            data-lpignore="true"
                            spellCheck={false}
                            className={cn(FIELD, "mt-1 h-9 font-mono text-[13px]")}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[11px] text-neutral-500">Value</label>
                        <div className="relative mt-1">
                            <Input
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
                                    FIELD,
                                    "h-9 pr-9 font-mono text-[13px]",
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
                                    <MdVisibilityOff className="size-3" aria-hidden />
                                ) : (
                                    <MdVisibility className="size-3" aria-hidden />
                                )}
                            </Button>
                        </div>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="h-9"
                        loading={setSecrets.isPending}
                        disabled={!canAdd}
                        onClick={addSecret}
                    >
                        <MdAdd className="size-3" aria-hidden />
                        Add
                    </Button>
                </div>
                {newKey.length > 0 && !keyValid && (
                    <p className="mt-2 text-[11px] text-red-400">
                        Keys must start with a letter or underscore and contain only letters,
                        numbers, and underscores.
                    </p>
                )}
            </div>

            {/* Existing keys */}
            <div>
                <h3 className="mb-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                    {list.length} variable{list.length === 1 ? "" : "s"}
                </h3>
                {secrets.isLoading ? (
                    <p className="px-1 py-3 text-[13px] text-neutral-500">Loading…</p>
                ) : list.length === 0 ? (
                    <p className="rounded-lg bg-white/5 px-3 py-6 text-center text-[13px] text-neutral-500 shadow-[inset_0_1px_0_0_#262626]">
                        No environment variables yet.
                    </p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {list.map((s) => {
                            const deleting =
                                deleteSecret.isPending && deleteSecret.variables?.key === s.key;
                            return (
                                <div
                                    key={s.key}
                                    className="group flex items-center justify-between gap-3 rounded-lg bg-cement px-3 py-2 shadow-[inset_0_1px_0_0_#212122]"
                                >
                                    <section>
                                        <div className="flex items-center justify-center gap-x-3">
                                            <MdVpnKey
                                                className="size-3 shrink-0 text-neutral-500"
                                                aria-hidden
                                            />
                                            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-neutral-200">
                                                {s.key}
                                            </span>
                                        </div>
                                        <div className="mt-1 truncate pl-6 font-mono text-[12px] leading-none text-neutral-600">
                                            {maskDots(s.key)}
                                        </div>
                                    </section>
                                    <section className="flex items-center justify-center gap-x-3">
                                        <span className="shrink-0 text-[10px] text-neutral-600">
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
                                            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500 disabled:opacity-40 [&_svg]:size-3"
                                        >
                                            <MdDelete className="size-3" aria-hidden />
                                        </Button>
                                    </section>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
