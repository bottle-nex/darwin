"use client";
import { ApiKeyIcon } from "@trydarwin/ui/icons";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiKeys } from "@/hooks/apiKeys/useApiKeys";
import { useCreateApiKey } from "@/hooks/apiKeys/useCreateApiKey";
import { useRevokeApiKey } from "@/hooks/apiKeys/useRevokeApiKey";
import { cn } from "@/lib/utils";
import { CLAUDE_MCP_CONNECTOR_URL, CLAUDE_MCP_URL } from "@/routes/api_routes";
import type { CreatedApiKey } from "@/types/apiKey.type";

import CopyIconButton from "./CopyIconButton";
import SettingsRow, { SETTINGS_CONTROL_WIDTH } from "./SettingsRow";
import SettingsUtilityCard from "./SettingsUtilityCard";

function formatDate(value: string | null) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CodeRow({ value, copyLabel }: { value: string; copyLabel: string }) {
    return (
        <div className="flex items-center gap-2">
            <code className="surface-inset h-8 min-w-0 flex-1 truncate rounded-[8px] px-2.5 text-[12px] leading-8 text-neutral-300">
                {value}
            </code>
            <CopyIconButton value={value} label={copyLabel} />
        </div>
    );
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
        <div className="border-success-edge bg-success-surface flex flex-col gap-y-3 rounded-lg border p-3">
            <div className="flex flex-col gap-y-1.5">
                <p className="text-success text-xs">
                    Paste this as the &quot;Remote MCP server URL&quot; in Claude&apos;s Add custom
                    connector dialog — leave Name free-text and skip the OAuth fields.
                </p>
                <CodeRow value={connectorUrl} copyLabel="Copy connector url" />
            </div>

            <div className="flex flex-col gap-y-1.5">
                <p className="text-xs text-neutral-400">
                    Or the raw key, if you&apos;re configuring headers by hand — you won&apos;t be
                    able to see it again.
                </p>
                <CodeRow value={createdKey.key} copyLabel="Copy api key" />
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
        <SettingsUtilityCard title="API keys" rows>
            <SettingsRow
                label="MCP server URL"
                description="Point Claude's custom connector at this address."
            >
                <div className={SETTINGS_CONTROL_WIDTH}>
                    <CodeRow value={CLAUDE_MCP_URL} copyLabel="Copy MCP url" />
                </div>
            </SettingsRow>

            {createdKey && (
                <SettingsRow
                    label="Your new key"
                    description="Copy it now — it won't be shown again."
                    stack
                >
                    <CreatedKeyBanner
                        createdKey={createdKey}
                        onDismiss={() => setCreatedKey(null)}
                    />
                </SettingsRow>
            )}

            <SettingsRow label="New key" description="Name it so you can tell your keys apart.">
                <div className={cn(SETTINGS_CONTROL_WIDTH, "flex items-center gap-2")}>
                    <Input
                        variant="outline"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Claude Desktop"
                        maxLength={60}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        className="h-8 text-[13px]"
                    />
                    <Button
                        type="button"
                        variant="flat-primary"
                        size="sm"
                        loading={createApiKey.isPending}
                        disabled={!ready}
                        onClick={submit}
                        className="h-8 shrink-0"
                    >
                        Create key
                    </Button>
                </div>
            </SettingsRow>

            {isLoading && <div className="px-5 py-4 text-[12px] text-neutral-500">Loading...</div>}
            {!isLoading && activeKeys.length === 0 && (
                <div className="px-5 py-4 text-[12px] text-neutral-500">No api keys yet.</div>
            )}
            {!isLoading &&
                activeKeys.map((key) => (
                    <SettingsRow
                        key={key.id}
                        label={
                            <span className="flex items-center gap-2">
                                <ApiKeyIcon
                                    className="size-3.5 shrink-0 text-neutral-500"
                                    aria-hidden
                                />
                                <span className="truncate">{key.label}</span>
                            </span>
                        }
                        description={
                            <span className="font-mono">
                                {key.prefix}••••••••{" · "}
                                last used {formatDate(key.lastUsedAt)}
                            </span>
                        }
                    >
                        <Button
                            type="button"
                            variant="flat-destructive"
                            size="sm"
                            disabled={revokeApiKey.isPending}
                            onClick={() =>
                                revokeApiKey.mutate(key.id, {
                                    onError: () => toast.error("Failed to revoke api key"),
                                })
                            }
                        >
                            Revoke
                        </Button>
                    </SettingsRow>
                ))}
        </SettingsUtilityCard>
    );
}
