"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { StepItem, UNDERLINE_FIELD } from "../StepFrame";
import type { TourDraft } from "../steps";

export default function StepBasics({
    draft,
    onChange,
}: {
    draft: TourDraft;
    onChange: (patch: Partial<TourDraft>) => void;
}) {
    return (
        <>
            <StepItem>
                <Label htmlFor="tour-title" className="text-[13px] text-neutral-500">
                    Title
                </Label>
                <Input
                    id="tour-title"
                    value={draft.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder="Payment service"
                    className={UNDERLINE_FIELD}
                />
            </StepItem>
            <StepItem>
                <Label htmlFor="tour-summary" className="text-[13px] text-neutral-500">
                    Summary
                </Label>
                <Input
                    id="tour-summary"
                    value={draft.summary}
                    onChange={(e) => onChange({ summary: e.target.value })}
                    placeholder="Checkout, billing, and webhook fan-out for every Acme surface"
                    className={UNDERLINE_FIELD}
                />
            </StepItem>
            <StepItem>
                <Label htmlFor="tour-description" className="text-[13px] text-neutral-500">
                    Description
                </Label>
                <Textarea
                    id="tour-description"
                    value={draft.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Where this service starts and stops, and anything worth knowing up front."
                    className={cn(UNDERLINE_FIELD, "h-auto min-h-16 resize-none text-[15px]")}
                />
            </StepItem>
        </>
    );
}
