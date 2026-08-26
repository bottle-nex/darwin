import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoResourceProps {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
    };
    children?: ReactNode;
    className?: string;
}

export default function NoResource({
    icon,
    title,
    description,
    action,
    children,
    className,
}: NoResourceProps) {
    return (
        <div className={cn("flex h-[70vh] flex-col items-start justify-center px-6", className)}>
            {icon ? <div className="mb-7">{icon}</div> : null}

            <h2 className="text-lg font-500 tracking-tight text-neutral-100">{title}</h2>

            <p className="mt-2 max-w-sm text-[12.75px] leading-relaxed text-neutral-400">
                {description}
            </p>

            {action || children ? (
                <div className="mt-7 flex flex-wrap items-center gap-2.5">
                    {action ? (
                        <Button onClick={action.onClick} disabled={action.disabled}>
                            {action.label}
                        </Button>
                    ) : null}
                    {children}
                </div>
            ) : null}
        </div>
    );
}
