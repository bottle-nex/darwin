import type { IssueDraftRecord } from "@/types/issueDraft.type";

const DB_NAME = "matcha-issue-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

function openDb(): Promise<IDBDatabase> | null {
    if (typeof indexedDB === "undefined") return null;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
    try {
        const db = await openDb();
        if (!db) return undefined;
        return await new Promise<T>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, mode);
            const request = run(tx.objectStore(STORE_NAME));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return undefined;
    }
}

export function editDraftKey(issueId: string): string {
    return `edit:${issueId}`;
}

export async function getIssueDraft(key: string): Promise<IssueDraftRecord | undefined> {
    return withStore("readonly", (store) => store.get(key));
}

export async function putIssueDraft(record: IssueDraftRecord): Promise<void> {
    await withStore("readwrite", (store) => store.put(record));
}

export async function deleteIssueDraft(key: string): Promise<void> {
    await withStore("readwrite", (store) => store.delete(key));
}

export async function deleteIssueDrafts(keys: string[]): Promise<void> {
    await Promise.all(keys.map(deleteIssueDraft));
}
