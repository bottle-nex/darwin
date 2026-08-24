"use client";
import { useState } from "react";
import { MdContentCopy, MdKey } from "react-icons/md";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiKeys } from "@/hooks/apiKeys/useApiKeys";
import { useCreateApiKey } from "@/hooks/apiKeys/useCreateApiKey";
import { useRevokeApiKey } from "@/hooks/apiKeys/useRevokeApiKey";
import { cn } from "@/lib/utils";
import { CLAUDE_MCP_CONNECTOR_URL,CLAUDE_MCP_URL } from "@/routes/api_routes";
import type { CreatedApiKey } from "@/types/apiKey.type";

import SettingsUtilityCard from "./SettingsUtilityCard";

function formatDate(value: string | null) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CreatedKeyBanner({
    createdKey,
    onDismiss,
}: {
    createdKey: CreatedApiKey;
    onDismiss: () => void;
}) {
    const connectorUrl = CLAUDE_MCP_CONNECTOR_URL(createdKey.key);

    return (
        <div className="flex flex-col gap-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex flex-col gap-y-1.5">
                <p className="text-xs text-emerald-300">
                    Paste this as the &quot;Remote MCP server URL&quot; in Claude&apos;s Add custom
                    connector dialog — leave Name free-text and skip the OAuth fields.
                </p>
                <div className="flex items-center gap-x-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-charcoal px-2.5 py-1.5 text-[12px] text-neutral-200">
                        {connectorUrl}
                    </code>
                    <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                            navigator.clipboard.writeText(connectorUrl);
                            toast.success("Copied connector url");
                        }}
                    >
                        <MdContentCopy className="size-3" />
                        Copy
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-y-1.5">
                <p className="text-xs text-neutral-400">
                    Or the raw key, if you&apos;re configuring headers by hand — you won&apos;t be
                    able to see it again.
                </p>
                <div className="flex items-center gap-x-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-charcoal px-2.5 py-1.5 text-[12px] text-neutral-200">
                        {createdKey.key}
                    </code>
                    <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                            navigator.clipboard.writeText(createdKey.key);
                            toast.success("Copied to clipboard");
                        }}
                    >
                        <MdContentCopy className="size-3" />
                        Copy
                    </Button>
                </div>
            </div>
            <Button
                type="button"
                variant="unstyled"
                size="xs"
                onClick={onDismiss}
                className="self-end cursor-pointer text-neutral-500 hover:text-neutral-300"
            >
                Done
            </Button>
        </div>
    );
}

export default function ApiKeysSettingsSection() {
    const { data: apiKeys, isLoading } = useApiKeys();
    const createApiKey = useCreateApiKey();
    const revokeApiKey = useRevokeApiKey();

    const [label, setLabel] = useState("");
    const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

    const ready = Boolean(label.trim()) && !createApiKey.isPending;

    function submit() {
        if (!ready) return;
        createApiKey.mutate(label.trim(), {
            onSuccess: (api_key: CreatedApiKey) => {
                setCreatedKey(api_key);
                setLabel("");
            },
            onError: () => toast.error("Failed to create api key"),
        });
    }

    const activeKeys = (apiKeys ?? []).filter((key) => !key.revokedAt);

    return (
        <SettingsUtilityCard
            title="API keys"
            description="Create an api key to let Claude create issues on your projects via MCP."
        >
            <div className="flex items-center gap-x-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-charcoal px-2.5 py-1.5 text-[12px] text-neutral-400">
                    {CLAUDE_MCP_URL}
                </code>
                <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                        navigator.clipboard.writeText(CLAUDE_MCP_URL);
                        toast.success("Copied MCP url");
                    }}
                >
                    <MdContentCopy className="size-3" />
                    Copy
                </Button>
            </div>

            {createdKey && (
                <CreatedKeyBanner createdKey={createdKey} onDismiss={() => setCreatedKey(null)} />
            )}

            <div className="flex items-center gap-x-2">
                <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Claude Desktop"
                    maxLength={60}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    className="h-8 text-xs"
                />
                <Button
                    type="button"
                    variant="tertiary"
                    size="xs"
                    loading={createApiKey.isPending}
                    disabled={!ready}
                    onClick={submit}
                    className="text-ink! shrink-0"
                >
                    Create key
                </Button>
            </div>

            <div className="flex flex-col gap-y-1">
                {isLoading && <p className="py-2 text-xs text-neutral-500">Loading...</p>}
                {!isLoading && activeKeys.length === 0 && (
                    <p className="py-2 text-xs text-neutral-500">No api keys yet.</p>
                )}
                {activeKeys.map((key) => (
                    <div
                        key={key.id}
                        className="flex items-center gap-x-3 rounded-lg px-2.5 py-2 hover:bg-white/5"
                    >
                        <MdKey className="size-4 shrink-0 text-neutral-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] text-neutral-200">{key.label}</p>
                            <p className="truncate font-mono text-[11px] text-neutral-500">
                                {key.prefix}••••••••{" · "}
                                last used {formatDate(key.lastUsedAt)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="unstyled"
                            size="xs"
                            disabled={revokeApiKey.isPending}
                            onClick={() =>
                                revokeApiKey.mutate(key.id, {
                                    onError: () => toast.error("Failed to revoke api key"),
                                })
                            }
                            className={cn(
                                "cursor-pointer px-2 text-xs text-neutral-500 hover:text-red-300",
                            )}
                        >
                            Revoke
                        </Button>
                    </div>
                ))}
            </div>
        </SettingsUtilityCard>
    );
}
