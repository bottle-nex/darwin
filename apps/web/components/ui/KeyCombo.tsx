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
                        "inline-flex size-5 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium text-neutral-200 uppercase",
                        className,
                    )}
                >
                    {key}
                </kbd>
            ))}
        </div>
    );
}
