import { cn } from "@/lib/utils";

export default function SettingsUtilityCard({
    title,
    description,
    headerAction,
    footer,
    children,
    className,
}: {
    title: string;
    description?: React.ReactNode;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-border bg-snow/3 flex flex-col py-4",
                className,
            )}
        >
            <div className="w-full flex items-start justify-between gap-3 px-4">
                <div className="flex flex-col gap-0.5 items-start">
                    <span className="text-sm font-medium text-snow">{title}</span>
                    <span className="text-[13px] text-snow/60">{description}</span>
                </div>
                {headerAction && (
                    <div className="flex shrink-0 items-center gap-2">{headerAction}</div>
                )}
            </div>

            <div className="rounded-lg flex flex-col py-3 px-5 gap-5">{children}</div>

            {footer && <div className="py-3 px-3 w-full flex justify-end">{footer}</div>}
        </div>
    );
}
