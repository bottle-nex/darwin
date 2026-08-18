"use client";

import { useState } from "react";
import { promptsFromBraces, stripPrompts } from "@/lib/templates/promptHtml";
import type { IssueDescriptionState } from "./editor/IssueDescriptionEditor";
import type { PickableTemplate } from "@/types/issueTemplate";

export function useIssueDescription(initialHtml?: string) {
    const [html, setHtml] = useState(initialHtml ?? "");
    const [isEmpty, setIsEmpty] = useState(!initialHtml);
    const [prompts, setPrompts] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const [baseline, setBaseline] = useState<string | null>(null);

    const ready = !isEmpty && prompts === 0;
    const isDirty = baseline !== null && html !== baseline;

    function pickTemplate(template: PickableTemplate) {
        setHtml(promptsFromBraces(template.description));
        setIsEmpty(false);
        setEditorKey((key) => key + 1);
    }

    function onEditorChange(state: IssueDescriptionState) {
        if (baseline === null) setBaseline(state.html);
        setHtml(state.html);
        setIsEmpty(state.isEmpty);
        setPrompts(state.prompts);
    }

    function toHtml(): string {
        return stripPrompts(html);
    }

    return {
        html,
        isEmpty,
        prompts,
        ready,
        isDirty,
        editorKey,
        pickTemplate,
        onEditorChange,
        toHtml,
    };
}
