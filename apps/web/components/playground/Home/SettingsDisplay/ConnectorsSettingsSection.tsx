"use client";
import { TelegramLogoIcon } from "@trymatcha/ui/icons";
import { useSearchParams } from "next/navigation";
import { type ComponentType, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import SlackIcon from "@/components/ui/icons/SlackIcon";
import { useConnectors } from "@/hooks/connectors/useConnectors";
import { useDisconnectConnector } from "@/hooks/connectors/useDisconnectConnector";
import { useLinkConnector } from "@/hooks/connectors/useLinkConnector";
import type { ConnectorProvider, ConnectorStatus } from "@/types/connector.type";

import SettingsRow from "./SettingsRow";
import SettingsUtilityCard from "./SettingsUtilityCard";

const PROVIDER_META: Record<
    ConnectorProvider,
    { label: string; icon: ComponentType<{ className?: string }>; description: string }
> = {
    Slack: {
        label: "Slack",
        icon: SlackIcon,
        description: "matcha DMs you the question. Reply in the thread to answer.",
    },
    Telegram: {
        label: "Telegram",
        icon: TelegramLogoIcon,
        description: "matcha messages you on Telegram. Reply to answer.",
    },
};

export default function ConnectorsSettingsSection() {
    const { data: connectors, isLoading } = useConnectors();
    const link = useLinkConnector();
    const disconnect = useDisconnectConnector();
    const params = useSearchParams();

    useEffect(() => {
        const slack = params.get("slack");
        if (slack === "connected") toast.success("Slack connected");
        if (slack === "failed") toast.error("Could not connect Slack");
    }, [params]);

    const busy = link.isPending || disconnect.isPending;

    return (
        <SettingsUtilityCard title="Connectors" rows>
            {isLoading ? (
                <SettingsRow label="Loading connectors…">
                    <span />
                </SettingsRow>
            ) : (
                connectors?.map((connector) => (
                    <ConnectorRow
                        key={connector.provider}
                        connector={connector}
                        busy={busy}
                        onConnect={() =>
                            link.mutate(connector.provider, {
                                onSuccess: (url) => {
                                    window.location.href = url;
                                },
                                onError: () => toast.error("Could not start the connection"),
                            })
                        }
                        onDisconnect={() => disconnect.mutate(connector.provider)}
                    />
                ))
            )}
        </SettingsUtilityCard>
    );
}

function ConnectorRow({
    connector,
    busy,
    onConnect,
    onDisconnect,
}: {
    connector: ConnectorStatus;
    busy: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}) {
    const meta = PROVIDER_META[connector.provider];
    const Icon = meta.icon;

    return (
        <SettingsRow
            label={
                <span className="flex items-center gap-2">
                    <Icon className="size-4 text-snow/70" />
                    {meta.label}
                </span>
            }
            description={connector.available ? meta.description : "Not configured on this server."}
        >
            {connector.connected ? (
                <Button
                    type="button"
                    variant="flat-destructive"
                    size="sm"
                    disabled={busy}
                    onClick={onDisconnect}
                    className="h-8"
                >
                    Disconnect
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="flat-primary"
                    size="sm"
                    disabled={busy || !connector.available}
                    onClick={onConnect}
                    className="h-8"
                >
                    Connect
                </Button>
            )}
        </SettingsRow>
    );
}
