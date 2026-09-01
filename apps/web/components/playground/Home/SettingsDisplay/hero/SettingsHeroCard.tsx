import type { IconType } from "@trymatcha/ui/icons";

import { cn } from "@/lib/utils";

export default function SettingsHeroCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            aria-hidden
            className="pointer-events-none relative h-48 w-full shrink-0 overflow-hidden rounded-2xl border border-snow/5 bg-snow/1 select-none"
        >
            {children}
        </div>
    );
}

export function HeroPanel({
    accent,
    className,
    children,
}: {
    accent?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "absolute rounded-2xl border bg-graphite p-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]",
                accent ? "border-primary/45" : "border-snow/10",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function HeroTile({ icon: Icon, className }: { icon: IconType; className?: string }) {
    return (
        <span
            className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg bg-snow/8 text-snow/80",
                className,
            )}
        >
            <Icon className="size-4" />
        </span>
    );
}

export function HeroRow({
    icon,
    label,
    selected,
    trailing,
}: {
    icon: IconType;
    label: string;
    selected?: boolean;
    trailing?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2.5 rounded-lg border px-2.5 py-2",
                selected ? "border-primary/55 bg-primary/10" : "border-transparent",
            )}
        >
            <HeroTile icon={icon} className="size-7 rounded-md" />
            <span className="flex-1 text-[13px] font-medium text-snow/85">{label}</span>
            {trailing}
        </div>
    );
}

export function HeroLabel({ children }: { children: React.ReactNode }) {
    return <span className="text-[12px] font-medium text-snow/40">{children}</span>;
}

export function HeroLine({ className }: { className?: string }) {
    return <span className={cn("block h-2 rounded-full bg-snow/12", className)} />;
}

export function HeroButton({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-ink",
                className,
            )}
        >
            {children}
        </span>
    );
}

export function HeroChip({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md bg-snow/7 px-2.5 py-1.5 text-[12px] text-snow/70",
                className,
            )}
        >
            {children}
        </span>
    );
}

export function HeroSwitch({ on }: { on?: boolean }) {
    return (
        <span
            className={cn(
                "flex h-5 w-9 shrink-0 items-center rounded-full px-0.5",
                on ? "justify-end bg-primary" : "bg-snow/15",
            )}
        >
            <span className="size-4 rounded-full bg-snow shadow" />
        </span>
    );
}

export function HeroInput({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex items-center rounded-lg border border-snow/8 bg-snow/5 px-3 py-2 text-[13px] text-snow/75",
                className,
            )}
        >
            {children}
        </div>
    );
}
