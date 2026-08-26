"use client";
import type { Capsule } from "@trymatcha/types";
import { MdHorizontalSplit } from "react-icons/md";

export default function CapsuleHeader({
}: {
    capsule: Capsule;
    total: number;
    baseSha: string;
    headSha: string;
}) {

    return (
        <header className="flex shrink-0 flex-col gap-1.5 pb-3">
            <h2 className="flex items-center gap-1.5 text-[18px] font-medium text-snow">
                <MdHorizontalSplit className="size-4.5 text-neutral-400" aria-hidden />
                UI Previews
            </h2>
        </header>
    );
}
