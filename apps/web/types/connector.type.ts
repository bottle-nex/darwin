export type ConnectorProvider = "Slack" | "Telegram";

export interface ConnectorStatus {
    provider: ConnectorProvider;
    available: boolean;
    connected: boolean;
    connectedAt: string | null;
}

export interface PendingQuestion {
    id: string;
    key: string;
    prompt: string;
    type: string;
    projectName: string | null;
}
