export const CAPSULE_MANIFEST_VERSION = 5;

export type CapsuleFidelity = "Verified" | "Partial" | "Failed";

export type CapsuleChange = "Modified" | "Added" | "Removed";

export type CapsuleControlKind = "enum" | "boolean" | "string" | "number";

export type CapsuleControlValue = string | number | boolean;

export interface CapsuleControl {
    name: string;
    kind: CapsuleControlKind;
    options?: string[];
    default: CapsuleControlValue;
}

export interface CapsuleRevision {
    path: string;
    fidelity: CapsuleFidelity;
    diagnostics: string[];
}

export interface CapsuleViewport {
    width: number;
    height: number;
}

export interface Capsule {
    id: string;
    title: string;
    componentPath: string;
    change: CapsuleChange;
    viewport: CapsuleViewport;
    controls: CapsuleControl[];
    base: CapsuleRevision | null;
    head: CapsuleRevision | null;
}

export interface CapsuleManifest {
    version: typeof CAPSULE_MANIFEST_VERSION;
    capsules: Capsule[];
    warnings: string[];
}

export function is_capsule_manifest(manifest: unknown): manifest is CapsuleManifest {
    return (
        typeof manifest === "object" &&
        manifest !== null &&
        "version" in manifest &&
        (manifest as { version: unknown }).version === CAPSULE_MANIFEST_VERSION
    );
}

export function capsule_artifact_keys(manifest: CapsuleManifest | null): Set<string> {
    const keys = new Set<string>();
    if (!manifest) return keys;

    for (const capsule of manifest.capsules) {
        for (const revision of [capsule.base, capsule.head]) {
            if (revision) keys.add(revision.path);
        }
    }
    return keys;
}

export function capsule_control_hash(values: Record<string, CapsuleControlValue>): string {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(values)) {
        query.set(name, String(value));
    }
    return query.toString();
}
