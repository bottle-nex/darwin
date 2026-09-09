import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "placeholder:text-muted-foreground selection:bg-primary/30 selection:text-primary-foreground surface-inset border-0 flex field-sizing-content min-h-16 w-full min-w-0 rounded-md px-4 py-2 text-sm text-foreground transition-[color,box-shadow] duration-200 ease-in-out outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
