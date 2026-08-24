import Image from "next/image";

import { MatchaLogo } from "@/components/logo/MatchaLogo";
import { cn } from "@/lib/utils";

type GridCellProps = {
    variant?: "image" | "logo";
    imageSrc?: string;
    imageAlt?: string;
    darker?: boolean;
};

export default function GridCell({ variant, imageSrc, imageAlt, darker }: GridCellProps) {
    if (variant === "image" && imageSrc) {
        return (
            <div className="relative aspect-square overflow-hidden shadow-md">
                <Image src={imageSrc} alt={imageAlt ?? ""} fill className="object-cover" />
            </div>
        );
    }

    if (variant === "logo") {
        return (
            <div className="flex aspect-square items-center justify-center">
                <MatchaLogo className="h-8 w-auto text-neutral-100" />
            </div>
        );
    }

    return (
        <div
            aria-hidden
            className={cn("aspect-square", darker ? "bg-white/4" : "bg-transparent")}
        />
    );
}
