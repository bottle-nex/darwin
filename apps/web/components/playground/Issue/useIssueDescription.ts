"use client";

import { useState } from "react";
import { promptsFromBraces, stripPrompts } from "@/lib/templates/promptHtml";
import type { IssueDescriptionState } from "./editor/IssueDescriptionEditor";
import type { PickableTemplate } from "@/types/issueTemplate";

type DescriptionDraft = {
    html: string;
    isEmpty: boolean;
    prompts: number;
    editorKey: number;
    baseline: string | null;
};

export function useIssueDescription(initialHtml?: string) {
    const [draft, setDraft] = useState<DescriptionDraft>({
        html: initialHtml ?? "",
        isEmpty: !initialHtml,
        prompts: 0,
        editorKey: 0,
        baseline: null,
    });

    const ready = !draft.isEmpty && draft.prompts === 0;
    const isDirty = draft.baseline !== null && draft.html !== draft.baseline;

    function pickTemplate(template: PickableTemplate) {
        setDraft((current) => ({
            ...current,
            html: promptsFromBraces(template.description),
            isEmpty: false,
            editorKey: current.editorKey + 1,
        }));
    }

    function onEditorChange(state: IssueDescriptionState) {
        setDraft((current) => ({
            ...current,
            html: state.html,
            isEmpty: state.isEmpty,
            prompts: state.prompts,
            baseline: current.baseline ?? state.html,
        }));
    }

    function toHtml(): string {
        return stripPrompts(draft.html);
    }

    return {
        html: draft.html,
        isEmpty: draft.isEmpty,
        prompts: draft.prompts,
        ready,
        isDirty,
        editorKey: draft.editorKey,
        pickTemplate,
        onEditorChange,
        toHtml,
    };
}
