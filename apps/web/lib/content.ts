import type { ContentEntry, ContentSummary } from "@trymatcha/editorial";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4402";

const CONTENT_URL = `${BACKEND_URL}/api/v1/content`;

const REVALIDATE_SECONDS = 60;

export const CONTENT_TAG = "content";

async function fetchContent<T>(path: string): Promise<T | null> {
    try {
        const response = await fetch(`${CONTENT_URL}${path}`, {
            next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] },
        });
        if (!response.ok) {
            console.error(`[content] ${path} responded ${response.status}`);
            return null;
        }

        const body = await response.json();
        return body.success ? (body.data as T) : null;
    } catch (err) {
        console.error(`[content] ${path} failed`, err);
        return null;
    }
}

export async function getPosts(): Promise<ContentSummary[]> {
    return (await fetchContent<ContentSummary[]>("/blog")) ?? [];
}

export async function getReleases(): Promise<ContentSummary[]> {
    return (await fetchContent<ContentSummary[]>("/changelog")) ?? [];
}

export async function getEntry(slug: string): Promise<ContentEntry | null> {
    return fetchContent<ContentEntry>(`/entry/${encodeURIComponent(slug)}`);
}
