"use client";
import type { KeyboardEvent } from "react";

import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { IssueFormState } from "./useIssueForm";

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
            className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
        />
    );
}
