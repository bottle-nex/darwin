"use client";

import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
    MENU_ITEM,
    MENU_ITEM_DESTRUCTIVE,
    MENU_LABEL,
    MENU_SEPARATOR,
    MENU_SIDE_OFFSET,
    MENU_SURFACE,
} from "./menuSurface";

const CONTENT_ORIGIN = "origin-(--radix-context-menu-content-transform-origin)";

function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
    return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuPortal({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
    return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuTrigger({
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
    return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

/** Anchored to the pointer, so unlike a dropdown it takes no `side`/`align` offset. */
function ContextMenuContent({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
    return (
        <ContextMenuPrimitive.Portal>
            <ContextMenuPrimitive.Content
                data-slot="context-menu-content"
                className={cn(MENU_SURFACE, CONTENT_ORIGIN, className)}
                {...props}
            />
        </ContextMenuPrimitive.Portal>
    );
}

function ContextMenuGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
    return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuItem({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
    variant?: "default" | "destructive";
}) {
    return (
        <ContextMenuPrimitive.Item
            data-slot="context-menu-item"
            className={cn(MENU_ITEM, variant === "destructive" && MENU_ITEM_DESTRUCTIVE, className)}
            {...props}
        />
    );
}

function ContextMenuCheckboxItem({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
    return (
        <ContextMenuPrimitive.CheckboxItem
            data-slot="context-menu-checkbox-item"
            className={cn(MENU_ITEM, className)}
            {...props}
        />
    );
}

function ContextMenuRadioGroup({
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
    return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

function ContextMenuRadioItem({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
    return (
        <ContextMenuPrimitive.RadioItem
            data-slot="context-menu-radio-item"
            className={cn(MENU_ITEM, className)}
            {...props}
        />
    );
}

/** Callers place this themselves — the app's menus show the check trailing, not inset. */
function ContextMenuItemIndicator({
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.ItemIndicator>) {
    return (
        <ContextMenuPrimitive.ItemIndicator data-slot="context-menu-item-indicator" {...props} />
    );
}

function ContextMenuLabel({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label>) {
    return (
        <ContextMenuPrimitive.Label
            data-slot="context-menu-label"
            className={cn(MENU_LABEL, className)}
            {...props}
        />
    );
}

function ContextMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
    return (
        <ContextMenuPrimitive.Separator
            data-slot="context-menu-separator"
            className={cn(MENU_SEPARATOR, className)}
            {...props}
        />
    );
}

function ContextMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="context-menu-shortcut"
            className={cn("ml-auto text-[11px] text-neutral-500", className)}
            {...props}
        />
    );
}

function ContextMenuSub({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
    return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuSubTrigger({
    className,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger>) {
    return (
        <ContextMenuPrimitive.SubTrigger
            data-slot="context-menu-sub-trigger"
            className={cn(MENU_ITEM, "data-[state=open]:bg-overlay/5", className)}
            {...props}
        />
    );
}

function ContextMenuSubContent({
    className,
    sideOffset = MENU_SIDE_OFFSET,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
    return (
        <ContextMenuPrimitive.SubContent
            data-slot="context-menu-sub-content"
            sideOffset={sideOffset}
            className={cn(MENU_SURFACE, CONTENT_ORIGIN, className)}
            {...props}
        />
    );
}

export {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuItemIndicator,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
};
