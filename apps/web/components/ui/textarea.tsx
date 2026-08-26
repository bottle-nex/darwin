import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "placeholder:text-[#737373] selection:bg-primary/30 selection:text-primary-foreground flex field-sizing-content min-h-16 w-full min-w-0 rounded-md border-0 bg-snow/5 hover:bg-snow/6 px-4 py-2 text-sm text-[#e5e5e5] transition-[color,box-shadow] duration-200 ease-in-out outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
