"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepItem, UNDERLINE_FIELD } from "../StepFrame";
import type { TourDraft } from "../steps";

export default function StepTeam({
    draft,
    onChange,
}: {
    draft: TourDraft;
    onChange: (patch: Partial<TourDraft>) => void;
}) {
    return (
        <>
            <StepItem>
                <Label htmlFor="tour-team" className="text-[13px] text-neutral-500">
                    Team name
                </Label>
                <Input
                    id="tour-team"
                    value={draft.teamName}
                    onChange={(e) => onChange({ teamName: e.target.value })}
                    placeholder="Payments"
                    className={UNDERLINE_FIELD}
                />
            </StepItem>
            <StepItem>
                <p className="text-[13px] text-neutral-600">You can invite people after setup.</p>
            </StepItem>
        </>
    );
}
