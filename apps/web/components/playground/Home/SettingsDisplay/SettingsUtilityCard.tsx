import { cn } from "@/lib/utils";

export default function SettingsUtilityCard({
    title,
    headerAction,
    footer,
    children,
    className,
    rows = false,
}: {
    title: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    rows?: boolean;
}) {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="mx-2 flex items-center justify-between gap-3">
                <span className="text-[15px] leading-tight font-medium text-snow">{title}</span>
                {headerAction && (
                    <div className="flex shrink-0 items-center gap-2">{headerAction}</div>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-snow/3">
                <div
                    className={
                        rows
                            ? "flex flex-col divide-y divide-border"
                            : "flex flex-col gap-5 px-5 py-6"
                    }
                >
                    {children}
                </div>

                {footer && (
                    <div className="flex w-full justify-end border-t border-border px-4 py-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
