export type ApiKey = {
    id: string;
    label: string;
    prefix: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

export type CreatedApiKey = ApiKey & { key: string };
