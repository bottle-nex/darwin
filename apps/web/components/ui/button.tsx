import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Azeret_Mono } from "next/font/google";
import { TbLoader2 } from "react-icons/tb";
import { cn } from "@/lib/utils";

export const azeretMono = Azeret_Mono({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
    display: "swap",
});

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-sm border-transparent bg-clip-padding text-[12px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-70 aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "bg-linear-to-b from-neutral-700 to-neutral-900 text-white shadow-[inset_0_2px_0_0_rgba(255,255,255,0.20),inset_0_-2.5px_0_0_rgba(0,0,0,0.7),0_1px_2px_0_rgba(15,23,42,0.20),0_2px_6px_1px_rgba(15,23,42,0.26)] hover:from-neutral-600 hover:to-neutral-800 focus-visible:border-ring dark:from-neutral-200 dark:to-neutral-200 dark:text-neutral-950 dark:shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.9),inset_0_-2px_0_0_rgba(0,0,0,0.35),0_1px_3px_0_rgba(0,0,0,0.4)] dark:hover:from-neutral-200 dark:hover:to-neutral-300",
                secondary:
                    "bg-linear-to-b from-neutral-100 to-neutral-200 text-neutral-900 shadow-[inset_0_2px_0_0_rgba(255,255,255,1),inset_0_-2.5px_0_0_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.08)] hover:bg-neutral-50 focus-visible:border-ring [&_svg]:text-neutral-400 hover:[&_svg]:text-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_0_0_rgba(0,0,0,0.3),0_1px_3px_0_rgba(0,0,0,0.3)] dark:hover:from-neutral-600 dark:hover:to-neutral-700 dark:[&_svg]:text-neutral-400",
                outline:
                    "bg-linear-to-b from-white to-neutral-50 text-foreground border border-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),inset_0_-1px_0_0_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.06)] hover:bg-neutral-50 focus-visible:border-ring aria-expanded:bg-neutral-50 dark:from-neutral-800 dark:to-neutral-800 dark:border-neutral-600 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.2)] dark:hover:from-neutral-700 dark:hover:to-neutral-700 dark:aria-expanded:from-neutral-700",
                destructive:
                    "bg-linear-to-b from-red-500 to-red-700 text-white shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.20),inset_0_-2px_0_0_rgba(0,0,0,0.40),0_1px_2px_0_rgba(185,28,28,0.25),0_2px_4px_1px_rgba(185,28,28,0.20)] hover:brightness-110 focus-visible:ring-destructive/40 dark:from-red-600 dark:to-red-800 dark:shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.15),inset_0_-2px_0_0_rgba(0,0,0,0.5)]",
                ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted dark:hover:bg-muted/60",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default:
                    "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                icon: "size-8",
                "icon-xs":
                    "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
                "icon-sm":
                    "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-md",
                "icon-lg": "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    loading = false,
    disabled,
    children,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        loading?: boolean;
    }) {
    if (asChild) {
        return (
            <Slot.Root
                data-slot="button"
                data-variant={variant}
                data-size={size}
                className={cn(
                    buttonVariants({ variant, size, className }),
                    azeretMono.className,
                    "font-light duration-150 ease-out active:scale-[0.99] cursor-pointer",
                )}
                {...props}
            >
                {children}
            </Slot.Root>
        );
    }

    return (
        <button
            data-slot="button"
            data-variant={variant}
            data-size={size}
            data-loading={loading || undefined}
            {...(loading ? { "aria-busy": true } : {})}
            disabled={loading || disabled}
            className={cn(
                buttonVariants({ variant, size, className }),
                azeretMono.className,
                "font-light duration-150 ease-out active:scale-[0.99] uppercase cursor-pointer",
            )}
            {...props}
        >
            {loading && <TbLoader2 className="animate-spin" />}
            {children}
        </button>
    );
}

export { buttonVariants };
