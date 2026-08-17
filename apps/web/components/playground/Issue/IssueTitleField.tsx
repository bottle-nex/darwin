"use client";
import type { KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { IssueFormState } from "./useIssueForm";

/** `field-sizing-content` grows the box with its text, so long titles wrap instead of scrolling. */
const FIELD =
    "field-sizing-content min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none outline-none hover:bg-transparent focus-visible:ring-0";

function blockNewline(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") event.preventDefault();
}

export default function IssueTitleField({ form }: { form: IssueFormState }) {
    const { fields, titleRef, readOnly } = form;

    return (
        <Textarea
            ref={titleRef}
            rows={1}
            autoFocus={!readOnly}
            readOnly={readOnly}
            placeholder="Issue Title"
            maxLength={80}
            value={fields.title}
            onChange={(e) => fields.setTitle(e.target.value)}
            onKeyDown={blockNewline}
            className={cn(FIELD, "w-full text-2xl leading-tight font-semibold text-neutral-100")}
        />
    );
}
