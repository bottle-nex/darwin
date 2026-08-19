"use client";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";
import type { IssueFormState } from "./useIssueForm";

/** The description editor. The caller owns the scroll container. */
export default function IssueBody({ form }: { form: IssueFormState }) {
    const { body, editorRef, readOnly, projectId } = form;

    return (
        <IssueDescriptionEditor
            key={body.editorKey}
            editable={!readOnly}
            mentionProjectId={projectId}
            initialContent={body.html}
            onChange={body.onEditorChange}
            onReady={(editor) => (editorRef.current = editor)}
        />
    );
}
