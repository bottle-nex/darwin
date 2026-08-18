"use client";
import { useParams, useRouter } from "next/navigation";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import ResourcePickerDialog from "./ResourcePickerDialog";

export default function SwitchOrganizationDialog() {
    const router = useRouter();
    const { orgSlug } = useParams<{ orgSlug?: string }>();
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const { data: organizations } = useFetchOrganizations();

    const orgs = organizations ?? [];
    const active = orgs.find((org) => org.slug === orgSlug);

    return (
        <ResourcePickerDialog
            open={pending === "switch-organization"}
            onOpenChange={(next) => !next && clear()}
            title="Switch organization"
            placeholder="Search organizations..."
            emptyLabel="No organizations found."
            activeId={active?.id ?? null}
            resources={orgs.map((org) => ({
                id: org.id,
                label: org.name,
                leading: (
                    <PlaygroundAvatar
                        tone="emerald"
                        size="sm"
                        letter={org.name.trim().charAt(0).toUpperCase()}
                    />
                ),
            }))}
            onPick={(id) => {
                const org = orgs.find((candidate) => candidate.id === id);
                clear();
                if (org && org.slug !== orgSlug) router.push(`/playground/${org.slug}`);
            }}
        />
    );
}
