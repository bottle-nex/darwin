import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Azeret_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoadingSpinnerIcon } from "@trymatcha/ui/icons";

export const azeretMono = Azeret_Mono({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
    display: "swap",
});

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-sm border-transparent bg-clip-padding text-[12px] font-500 whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-70 aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-[#3B315C] shadow-[0_1px_2px_0_rgba(15,23,42,0.12),0_1px_3px_0_rgba(15,23,42,0.10)] hover:from-[#C4BAFF] hover:to-[#B0A2FF] focus-visible:border-ring",
                secondary:
                    "bg-linear-to-b from-[#404040] to-neutral-900 text-white shadow-[0_1px_2px_0_rgba(15,23,42,0.12),0_1px_3px_0_rgba(15,23,42,0.14)] hover:from-neutral-600 hover:to-neutral-800 focus-visible:border-ring dark:from-neutral-200 dark:to-neutral-200 dark:text-neutral-950 dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.25)] dark:hover:from-neutral-200 dark:hover:to-neutral-300",
                tertiary:
                    "bg-linear-to-b from-[#E3E3E3] to-neutral-200 text-ink shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] hover:bg-neutral-50 focus-visible:border-ring [&_svg]:text-neutral-400 hover:[&_svg]:text-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] dark:hover:from-neutral-600 dark:hover:to-neutral-700 dark:[&_svg]:text-neutral-400 pl-4! pr-2! rounded-full",
                outline:
                    "bg-linear-to-b from-white to-neutral-50 text-foreground border border-neutral-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:bg-neutral-50 focus-visible:border-ring aria-expanded:bg-neutral-50 dark:from-neutral-800 dark:to-neutral-800 dark:border-neutral-600 dark:hover:from-neutral-700 dark:hover:to-neutral-700 dark:aria-expanded:from-neutral-700",
                destructive:
                    "bg-linear-to-b from-[#e84c4c] to-[#d83a3a] text-white shadow-[0_1px_2px_0_rgba(185,28,28,0.15)] outline-2 outline-offset-2 outline-[#d83a3a] outline-solid! hover:brightness-110 focus-visible:ring-destructive/40 dark:from-[#e04646] dark:to-[#cf3636]",
                ghost: "text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                unstyled: "cursor-pointer",
            },
            size: {
                default:
                    "h-8 gap-1.5 px-1.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                xs: "h-6.5 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-7 gap-1 rounded-[min(var(--radius-md),5px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
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

const DISABLEABLE_ELEMENTS = new Set(["button", "fieldset", "input", "select", "textarea"]);

type ButtonProps = React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        loading?: boolean;
        iconOnly?: boolean;
    };

export function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    loading = false,
    iconOnly,
    disabled,
    onClick,
    children,
    ...props
}: ButtonProps) {
    const unstyled = variant === "unstyled";
    const isDisabled = loading || disabled;
    const replacesChildren = iconOnly ?? (typeof size === "string" && size.startsWith("icon"));

    const spinner = loading ? (
        <LoadingSpinnerIcon aria-hidden className={cn("animate-spin", unstyled && "size-[1em]")} />
    ) : null;

    const rootClassName = unstyled
        ? className
        : cn(
              buttonVariants({ variant, size, className }),
              azeretMono.className,
              "font-500 duration-150 ease-out active:scale-[0.99] cursor-pointer",
          );

    if (asChild) {
        const child = React.isValidElement<{ children?: React.ReactNode }>(children)
            ? children
            : null;
        const forwardsDisabled =
            Boolean(isDisabled) &&
            typeof child?.type === "string" &&
            DISABLEABLE_ELEMENTS.has(child.type);

        return (
            <Slot.Root
                data-slot="button"
                data-variant={variant}
                data-size={size}
                data-loading={loading || undefined}
                data-disabled={isDisabled || undefined}
                aria-busy={loading || undefined}
                aria-disabled={isDisabled || undefined}
                className={cn(
                    rootClassName,
                    isDisabled && "pointer-events-none",
                    isDisabled && !unstyled && "opacity-70",
                )}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    if (isDisabled) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                    onClick?.(event);
                }}
                {...(forwardsDisabled ? { disabled: true } : {})}
                {...props}
            >
                {loading && child
                    ? React.cloneElement(
                          child,
                          undefined,
                          <>
                              {spinner}
                              {replacesChildren ? null : child.props.children}
                          </>,
                      )
                    : children}
            </Slot.Root>
        );
    }

    return (
        <button
            type="button"
            data-slot="button"
            data-variant={variant}
            data-size={size}
            data-loading={loading || undefined}
            aria-busy={loading || undefined}
            disabled={isDisabled}
            className={rootClassName}
            onClick={onClick}
            {...props}
        >
            {spinner}
            {loading && replacesChildren ? null : children}
        </button>
    );
}

export { buttonVariants };
export type { ButtonProps };
