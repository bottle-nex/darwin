"use client";

import { useState } from "react";
import { promptsFromBraces, stripPrompts } from "@/lib/templates/promptHtml";
import type { IssueDescriptionState } from "./editor/IssueDescriptionEditor";
import type { PickableTemplate } from "@/types/issueTemplate";

export function useIssueDescription(initialHtml?: string, initialTemplate?: PickableTemplate) {
    const opening = initialTemplate
        ? promptsFromBraces(initialTemplate.description)
        : (initialHtml ?? "");

    const [html, setHtml] = useState(opening);
    const [isEmpty, setIsEmpty] = useState(!opening);
    const [prompts, setPrompts] = useState(0);
    const [editorKey, setEditorKey] = useState(0);

    const ready = !isEmpty && prompts === 0;

    function pickTemplate(template: PickableTemplate) {
        setHtml(promptsFromBraces(template.description));
        setIsEmpty(false);
        setEditorKey((key) => key + 1);
    }

    function onEditorChange(state: IssueDescriptionState) {
        setHtml(state.html);
        setIsEmpty(state.isEmpty);
        setPrompts(state.prompts);
    }

    function toHtml(): string {
        return stripPrompts(html);
    }

    return { html, isEmpty, prompts, ready, editorKey, pickTemplate, onEditorChange, toHtml };
}
