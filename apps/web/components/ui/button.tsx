import { LoadingSpinnerIcon } from "@trydarwin/ui/icons";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-sm border-transparent bg-clip-padding text-[12px] font-500 whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-70 aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-ink shadow-[0_1px_2px_0_rgba(15,23,42,0.12),0_1px_3px_0_rgba(15,23,42,0.10)] focus-visible:border-ring",
                secondary:
                    "bg-linear-to-b from-[#404040] to-neutral-900 text-white shadow-[0_1px_2px_0_rgba(15,23,42,0.12),0_1px_3px_0_rgba(15,23,42,0.14)] hover:from-neutral-600 hover:to-neutral-800 focus-visible:border-ring",
                tertiary:
                    "bg-linear-to-b from-overlay/89 to-overlay/81 text-ink shadow-[var(--shadow-card)] focus-visible:border-ring [&_svg]:text-ink/40 hover:[&_svg]:text-ink/60 px-2! rounded-full",
                outline:
                    "bg-transparent text-foreground border border-border shadow-[var(--shadow-card)] hover:bg-overlay/6 focus-visible:border-ring aria-expanded:bg-overlay/6",
                destructive:
                    "bg-linear-to-b from-[#E34948] to-[#E34948] text-white shadow-[0_1px_2px_0_rgba(185,28,28,0.15)] hover:brightness-110 focus-visible:ring-destructive/40",
                ghost: "text-foreground hover:bg-overlay/8 rounded-sm!",
                link: "text-primary underline-offset-4 hover:underline",
                unstyled: "cursor-pointer",
                flat: "bg-overlay/8 text-overlay hover:bg-overlay/12 rounded-[8px]!",
                "flat-primary": "bg-primary text-ink hover:bg-primary/85 rounded-[8px]!",
                "flat-destructive":
                    "bg-danger-surface text-danger hover:bg-danger/20 rounded-[8px]!",
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
