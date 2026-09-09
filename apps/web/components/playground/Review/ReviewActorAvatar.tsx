import type { ReviewActor } from "@trydarwin/types";
import Image from "next/image";

import { cn } from "@/lib/utils";

const INTRINSIC_SIZE = 48;

export default function ReviewActorAvatar({
    actor,
    className,
}: {
    actor: ReviewActor | null;
    className?: string;
}) {
    const shape = cn("size-5 shrink-0 rounded-[4px]", className);

    if (actor?.avatarUrl) {
        return (
            <Image
                src={actor.avatarUrl}
                alt=""
                width={INTRINSIC_SIZE}
                height={INTRINSIC_SIZE}
                unoptimized
                className={cn(shape, "object-cover")}
            />
        );
    }

    return (
        <span
            className={cn(
                shape,
                "flex items-center justify-center bg-overlay/10 text-[11.5px] font-medium text-neutral-300",
            )}
        >
            {(actor?.login[0] ?? "?").toUpperCase()}
        </span>
    );
}
