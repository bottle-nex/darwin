"use client";
import type { IconType } from "@trymatcha/ui/icons";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { cn } from "@/lib/utils";

import type { FacetOption } from "./filterFacets";

type FacetOptionGlyphProps = {
    option: FacetOption | null;
    fallbackIcon?: IconType;
    className?: string;
};

export default function FacetOptionGlyph({
    option,
    fallbackIcon,
    className,
}: FacetOptionGlyphProps) {
    if (option?.avatarSrc !== undefined) {
        return (
            <PlaygroundAvatar
                letter={option.label.charAt(0).toUpperCase()}
                src={option.avatarSrc}
                tone={toneFor(option.value)}
                size="sm"
            />
        );
    }

    if (option?.dotColor) {
        return (
            <span
                className={cn("size-2 shrink-0 rounded-full", className)}
                style={{ backgroundColor: option.dotColor }}
                aria-hidden
            />
        );
    }

    if (option?.iconPick) {
        return (
            <IconPickGlyph pick={option.iconPick} className={cn("size-3.5 shrink-0", className)} />
        );
    }

    const Glyph = option?.icon ?? fallbackIcon;
    if (!Glyph) return null;

    return (
        <Glyph
            className={cn("size-3.5 shrink-0 text-neutral-400", option?.iconClassName, className)}
            aria-hidden
        />
    );
}
