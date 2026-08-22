"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import axios from "axios";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import IssueDescriptionEditor from "@/components/playground/Issue/editor/IssueDescriptionEditor";
import { htmlToMarkdown } from "@/lib/markdown";
import { useStartGithubLink } from "@/hooks/github/useGithubLink";
import { GITHUB_NOT_LINKED, usePostReviewComment } from "@/hooks/review/usePostReviewComment";

export default function ReviewComposer({
    projectId,
    pullNumber,
}: {
    projectId: string | undefined;
    pullNumber: number;
}) {
    const [html, setHtml] = useState("");
    const [isEmpty, setIsEmpty] = useState(true);
    const [needsLink, setNeedsLink] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const editorRef = useRef<Editor | null>(null);
    const post = usePostReviewComment(projectId, pullNumber);
    const startLink = useStartGithubLink();

    const submitRef = useRef(submit);
    useEffect(() => {
        submitRef.current = submit;
    });

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
            if (!editorRef.current?.isFocused) return;
            event.preventDefault();
            submitRef.current();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    function submit() {
        const body = htmlToMarkdown(html).trim();
        if (!body || post.isPending) return;
        post.mutate(body, {
            onSuccess: () => {
                setHtml("");
                setIsEmpty(true);
                setEditorKey((key) => key + 1);
            },
            onError: (error) => {
                const code = axios.isAxiosError(error)
                    ? error.response?.data?.error?.code
                    : undefined;
                setNeedsLink(code === GITHUB_NOT_LINKED);
            },
        });
    }

    if (needsLink) {
        return (
            <div className="flex flex-col items-start gap-2.5 rounded-xl border border-border px-4 py-4">
                <p className="text-[14.5px] text-neutral-400">
                    Connect your GitHub account to reply as yourself.
                </p>
                <Button
                    size="sm"
                    variant="tertiary"
                    loading={startLink.isPending}
                    onClick={() => startLink.mutate()}
                >
                    <FaGithub />
                    Connect GitHub
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-xl border border-border focus-within:border-white/20">
            <div className="max-h-80 min-h-24 overflow-y-auto px-4 pt-3" data-lenis-prevent>
                <IssueDescriptionEditor
                    key={editorKey}
                    className="tiptap-compact"
                    placeholder="Leave a comment…"
                    mentionProjectId={projectId}
                    onChange={(state) => {
                        setHtml(state.html);
                        setIsEmpty(state.isEmpty);
                    }}
                    onReady={(editor) => (editorRef.current = editor)}
                />
            </div>

            <div className="flex items-center justify-end gap-3 px-4 pb-3">
                {post.isError && !needsLink && (
                    <p className="mr-auto text-[13.5px] text-rose-400">
                        That comment didn&apos;t post. Try again.
                    </p>
                )}
                <span className="text-[13px] text-neutral-600">⌘↵ to comment</span>
                <Button size="sm" disabled={isEmpty} loading={post.isPending} onClick={submit}>
                    Comment
                </Button>
            </div>
        </div>
    );
}
