import type { WorkerDef } from "./types";

// Heights must match Timeline's ruler and Layer dimensions exactly
const RULER_HEIGHT = 80; // PADDING_TOP(52) + ACCENT_HEIGHT(28) in Timeline
const CHILDREN_PT = 24; // pt-6 on Timeline's children wrapper
const LAYER_HEIGHT = 52;
const LAYER_MB = 10;

interface SidebarProps {
    workers: WorkerDef[];
}

export default function Sidebar({ workers }: SidebarProps) {
    return (
        <div className="relative shrink-0 flex flex-col z-20" style={{ width: 140, background: "#0a0a0a" }}>
            {/* Spacer aligning the first capsule with the first layer row */}
            <div style={{ height: RULER_HEIGHT + CHILDREN_PT }} />

            {workers.map(({ id, name, color }) => (
                <div
                    key={id}
                    className="flex items-center px-4"
                    style={{ height: LAYER_HEIGHT, marginBottom: LAYER_MB }}
                >
                    <div
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white whitespace-nowrap"
                        style={{ background: color }}
                    >
                        {name}
                    </div>
                </div>
            ))}
        </div>
    );
}
