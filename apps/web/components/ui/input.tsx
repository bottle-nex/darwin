import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
    "file:text-foreground placeholder:text-[#737373] selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-md border-0 bg-snow/6 hover:bg-snow/6 px-4 py-1 text-sm text-[#e5e5e5] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 duration-200 ease-in-out focus-visible:ring-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    {
        variants: {
            variant: {
                default: "",
                ghost: "border-none shadow-none",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Input({
    className,
    type,
    variant,
    ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(inputVariants({ variant, className }))}
            {...props}
        />
    );
}

export { Input, inputVariants };
