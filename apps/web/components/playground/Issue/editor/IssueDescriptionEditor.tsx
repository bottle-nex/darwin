"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RichTextEditor, type RichTextEditorProps } from "@trymatcha/editor";
import { useMemo } from "react";

import { createReferenceMention } from "@/components/playground/Home/chat/referenceMention";
import { useActiveProject } from "@/hooks/useActiveProject";

export type { RichTextEditorState as IssueDescriptionState } from "@trymatcha/editor";

interface IssueDescriptionEditorProps extends Omit<RichTextEditorProps, "extraExtensions"> {
    /** Enables `@member` and `#issue` references, scoped to this project. */
    mentionProjectId?: string;
}

export default function IssueDescriptionEditor({
    mentionProjectId,
    ...props
}: IssueDescriptionEditorProps) {
    const queryClient = useQueryClient();
    const projectName = useActiveProject()?.name;

    const extraExtensions = useMemo(
        () =>
            mentionProjectId
                ? [
                      createReferenceMention({
                          queryClient,
                          projectId: mentionProjectId,
                          projectName,
                      }),
                  ]
                : [],
        [mentionProjectId, projectName, queryClient],
    );

    return <RichTextEditor {...props} extraExtensions={extraExtensions} />;
}
