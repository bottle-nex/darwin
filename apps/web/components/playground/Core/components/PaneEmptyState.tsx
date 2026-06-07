import type { LucideIcon } from "lucide-react";

type PaneEmptyStateProps = {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
};

/**
 * Placeholder body for a main pane that isn't built yet. Centered icon + title
 * + optional subtitle, sized to fill the pane area provided by `PlaygroundMainPane`.
 */
export default function PaneEmptyState({ icon: Icon, title, subtitle }: PaneEmptyStateProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
            <span
                className="flex size-14 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10"
                aria-hidden
            >
                <Icon className="size-6" />
            </span>
            <h2 className="mt-4 text-[15px] font-semibold text-neutral-100">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-neutral-500">{subtitle}</p>}
        </div>
    );
}
