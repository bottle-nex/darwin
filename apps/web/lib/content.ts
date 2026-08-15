import type { ContentEntry, ContentSummary } from "@trymatcha/editorial";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

const CONTENT_URL = `${BACKEND_URL}/api/v1/content`;

/** Published content changes rarely and only through the admin panel. */
const REVALIDATE_SECONDS = 300;

async function fetchContent<T>(path: string): Promise<T | null> {
    try {
        const response = await fetch(`${CONTENT_URL}${path}`, {
            next: { revalidate: REVALIDATE_SECONDS },
        });
        if (!response.ok) return null;

        const body = await response.json();
        return body.success ? (body.data as T) : null;
    } catch {
        return null;
    }
}

export async function getPosts(): Promise<ContentSummary[]> {
    return (await fetchContent<ContentSummary[]>("/blog")) ?? [];
}

export async function getPost(slug: string): Promise<ContentEntry | null> {
    return fetchContent<ContentEntry>(`/blog/${encodeURIComponent(slug)}`);
}

/** The changelog index renders entries in full, so this carries the body. */
export async function getReleases(): Promise<ContentEntry[]> {
    return (await fetchContent<ContentEntry[]>("/changelog")) ?? [];
}

export async function getRelease(slug: string): Promise<ContentEntry | null> {
    return fetchContent<ContentEntry>(`/changelog/${encodeURIComponent(slug)}`);
}
