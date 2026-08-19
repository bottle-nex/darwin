"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CLAUDE_MCP_URL, CLAUDE_MCP_CONNECTOR_URL } from "@/routes/api_routes";
import { useApiKeys } from "@/hooks/apiKeys/useApiKeys";
import { useCreateApiKey } from "@/hooks/apiKeys/useCreateApiKey";
import { useRevokeApiKey } from "@/hooks/apiKeys/useRevokeApiKey";
import type { CreatedApiKey } from "@/types/apiKey.type";
import { MdCheck, MdContentCopy, MdKey } from "react-icons/md";
import { useSidebarThemeStore } from "@/store/playground/useSidebarThemeStore";
import { useSetSidebarTheme } from "@/hooks/user/useSetSidebarTheme";
import { SIDEBAR_THEME_OPTIONS, meshPaletteFor, resolveGradientKey } from "@/lib/sidebarTheme";
import { MeshGradientSurface } from "@/components/playground/Sidebar/SidebarMeshGradient";

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

function AppearanceSection() {
    const activeTheme = useSidebarThemeStore((s) => s.theme);
    const setSidebarTheme = useSetSidebarTheme();
    const [hour] = useState(() => new Date().getHours());

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1">
                <h2 className="text-sm font-semibold text-neutral-100">Sidebar</h2>
                <p className="text-xs text-neutral-500">
                    Time of day shifts through the day, lightest in the morning and darker as night
                    approaches.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {SIDEBAR_THEME_OPTIONS.map(({ theme, label }) => {
                    const palette = meshPaletteFor(resolveGradientKey(theme, hour));
                    const active = theme === activeTheme;

                    return (
                        <Button
                            key={theme}
                            type="button"
                            variant="unstyled"
                            aria-pressed={active}
                            onClick={() => setSidebarTheme.mutate(theme)}
                            className="flex cursor-pointer flex-col items-stretch gap-y-1.5 text-left"
                        >
                            <span
                                className={cn(
                                    "relative h-14 overflow-hidden rounded-lg border border-white/5",
                                    !palette && "bg-ink",
                                    active && "ring-1 ring-matcha",
                                )}
                            >
                                {palette && <MeshGradientSurface palette={palette} blurPx={12} />}
                                {active && (
                                    <MdCheck
                                        className="absolute top-1.5 right-1.5 size-3.5 text-matcha"
                                        aria-hidden
                                    />
                                )}
                            </span>
                            <span className="text-[11px] text-neutral-400">{label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function ApiKeysSection() {
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
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1">
                <h2 className="text-sm font-semibold text-neutral-100">Claude MCP</h2>
                <p className="text-xs text-neutral-500">
                    Create an api key to let Claude create issues on your projects via MCP.
                </p>
            </div>

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
        </div>
    );
}

export default function SettingsPanel({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "flex max-h-[80vh] w-140 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <DialogTitle className="border-b border-white/5 px-6 py-4 text-base font-semibold text-neutral-100">
                    Settings
                </DialogTitle>
                <div
                    data-lenis-prevent
                    className="no-scrollbar flex flex-1 flex-col divide-y divide-white/5 overflow-y-auto px-6"
                >
                    <div className="py-5">
                        <AppearanceSection />
                    </div>
                    <div className="py-5">
                        <ApiKeysSection />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
