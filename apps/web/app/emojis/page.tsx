"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import IconPicker, { type IconPick, IconPickGlyph } from "@/components/ui/IconPicker";

export default function EmojisPage() {
    const [open, setOpen] = useState(false);
    const [pick, setPick] = useState<IconPick | null>(null);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink p-6">
            <div className="flex h-20 flex-col items-center justify-center gap-1.5">
                {pick === null ? (
                    <p className="text-[13px] text-neutral-500">Nothing picked yet.</p>
                ) : (
                    <>
                        <IconPickGlyph pick={pick} className="size-12 text-5xl" />
                        <p className="text-[11px] text-neutral-500">
                            {pick.kind === "icon" ? pick.name : pick.char}
                        </p>
                    </>
                )}
            </div>

            <IconPicker pick={pick} open={open} onOpenChange={setOpen} onSelect={setPick}>
                <Button variant="secondary">{pick ? "Pick another" : "Pick an icon"}</Button>
            </IconPicker>
        </main>
    );
}
