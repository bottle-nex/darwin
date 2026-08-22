import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PaneColumns({
    aside,
    tight = false,
    children,
}: {
    aside?: ReactNode;
    tight?: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                "grid min-h-0 min-w-0 flex-1",
                aside ? "grid-cols-[minmax(0,50rem)_16rem]" : "grid-cols-[minmax(0,1fr)]",
                tight ? "m-2" : "m-4",
            )}
        >
            <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
            {aside}
        </div>
    );
}
