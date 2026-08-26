"use client";
import type { ProductDiffManifestV4, ReplayRevisionArtifact } from "@trymatcha/types";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    replay_evidence_sections,
    select_replay_state,
    select_replay_surface,
    select_replay_viewport,
} from "@/lib/product-diff-replay";

type ReplayCatalogSelection = {
    applicationId: string;
    surfaceId: string;
    stateId: string;
    viewportId: string;
};

export default function ReplaySurfaceCatalog({
    manifest,
    selection,
    onApplicationChange,
    onSurfaceChange,
    onStateChange,
    onViewportChange,
}: {
    manifest: ProductDiffManifestV4;
    selection: ReplayCatalogSelection;
    onApplicationChange: (applicationId: string) => void;
    onSurfaceChange: (surfaceId: string) => void;
    onStateChange: (stateId: string) => void;
    onViewportChange: (viewportId: string) => void;
}) {
    const application = manifest.applications.find((item) => item.id === selection.applicationId);
    const surfaces = manifest.surfaces.filter((item) => item.applicationId === application?.id);
    const surface = select_replay_surface(manifest, selection);
    const state = select_replay_state(surface, selection.stateId);
    const viewport = select_replay_viewport(state, selection.viewportId);

    return (
        <section className="flex flex-col gap-3 border-b border-white/5 pb-4">
            <div className="flex flex-wrap items-center gap-2">
                <Picker
                    value={application?.id ?? ""}
                    onChange={onApplicationChange}
                    placeholder="Application"
                    options={manifest.applications.map((item) => ({
                        value: item.id,
                        label: item.applicationPath,
                    }))}
                />
                <Picker
                    value={surface?.id ?? ""}
                    onChange={onSurfaceChange}
                    placeholder="Surface"
                    options={surfaces.map((item) => ({ value: item.id, label: item.label }))}
                />
                <Picker
                    value={state?.id ?? ""}
                    onChange={onStateChange}
                    placeholder="State"
                    options={(surface?.states ?? []).map((item) => ({
                        value: item.id,
                        label: item.label,
                    }))}
                />
                <Picker
                    value={viewport?.id ?? ""}
                    onChange={onViewportChange}
                    placeholder="Viewport"
                    options={(state?.viewports ?? []).map((item) => ({
                        value: item.id,
                        label: `${item.label} · ${item.width}×${item.height}`,
                    }))}
                />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                <ArtifactSummary label="Base" artifact={viewport?.base} />
                <ArtifactSummary label="Head" artifact={viewport?.head} />
            </div>
        </section>
    );
}

function Picker({
    value,
    onChange,
    placeholder,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
}) {
    return (
        <Select value={value} onValueChange={onChange} disabled={options.length === 0}>
            <SelectTrigger size="sm" className="max-w-56 text-[14px]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function ArtifactSummary({
    label,
    artifact,
}: {
    label: string;
    artifact: ReplayRevisionArtifact | undefined;
}) {
    const diagnostics = artifact ? diagnostics_for(artifact) : [];
    const evidenceSections = artifact ? replay_evidence_sections(artifact) : [];
    return (
        <div className="rounded-md border border-white/5 bg-white/[0.025] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <span className={MICRO_LABEL}>{label}</span>
                <Fidelity value={artifact?.fidelity ?? "Unavailable"} />
            </div>
            {diagnostics.length > 0 && (
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                    {diagnostics.join(" · ")}
                </p>
            )}
            {evidenceSections.length > 0 && (
                <div className="mt-2 grid gap-2 border-t border-white/5 pt-2">
                    {evidenceSections.map((section) => (
                        <div key={section.label}>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                                {section.label}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
                                {section.values.join(" · ")}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Fidelity({ value }: { value: ReplayRevisionArtifact["fidelity"] }) {
    const color =
        value === "Verified"
            ? "bg-emerald-400/15 text-emerald-300"
            : value === "Partial"
              ? "bg-amber-400/15 text-amber-300"
              : "bg-neutral-500/15 text-neutral-400";
    return (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
            {value}
        </span>
    );
}

export function diagnostics_for(artifact: ReplayRevisionArtifact): string[] {
    return artifact.diagnostics.map((diagnostic) =>
        typeof diagnostic === "string" ? diagnostic : `${diagnostic.stage}: ${diagnostic.message}`,
    );
}
