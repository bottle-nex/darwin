import { cn } from "@/lib/utils";

interface KeyComboProps {
    keys: string[];
    className?: string;
}

export default function KeyCombo({ keys, className }: KeyComboProps) {
    return (
        <div className="flex items-center gap-1">
            {keys.map((key, index) => (
                <kbd
                    key={index}
                    className={cn(
                        "inline-flex min-w-6 items-center justify-center rounded border border-white/7 px-1.5 py-0.5 text-xs font-medium text-neutral-300 uppercase",
                        className,
                    )}
                >
                    {key}
                </kbd>
            ))}
        </div>
    );
}
