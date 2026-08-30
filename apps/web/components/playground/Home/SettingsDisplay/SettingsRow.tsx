import { cn } from "@/lib/utils";

export const SETTINGS_CONTROL_WIDTH = "w-72";

export default function SettingsRow({
    label,
    description,
    children,
    className,
    stack = false,
}: {
    label: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    stack?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex gap-6 px-5 py-4",
                stack ? "flex-col items-stretch" : "items-center justify-between",
                className,
            )}
        >
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] leading-tight text-snow">{label}</span>
                {description && (
                    <span className="text-[12px] leading-tight text-snow/50">{description}</span>
                )}
            </div>
            <div className={cn(stack ? "w-full" : "shrink-0")}>{children}</div>
        </div>
    );
}
