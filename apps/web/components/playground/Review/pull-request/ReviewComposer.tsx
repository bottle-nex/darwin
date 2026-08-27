"use client";
import type { Editor } from "@tiptap/react";
import { Action, Permissions } from "@trymatcha/access-control";
import type { ReviewHeader } from "@trymatcha/types";
import { GithubLogoIcon, SendIcon } from "@trymatcha/ui/icons";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

import IssueDescriptionEditor from "@/components/playground/Issue/editor/IssueDescriptionEditor";
import { Button } from "@/components/ui/button";
import { useGithubLink, useStartGithubLink } from "@/hooks/github/useGithubLink";
import { useGetProject } from "@/hooks/project/useGetProject";
import { GITHUB_NOT_LINKED, usePostReviewComment } from "@/hooks/review/usePostReviewComment";
import { htmlToMarkdown } from "@/lib/markdown";

export default function ReviewComposer({
    projectId,
    review,
}: {
    projectId: string | undefined;
    review: ReviewHeader;
}) {
    const [html, setHtml] = useState("");
    const [isEmpty, setIsEmpty] = useState(true);
    const [needsLink, setNeedsLink] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const editorRef = useRef<Editor | null>(null);
    const post = usePostReviewComment(projectId, review.pullNumber);
    const startLink = useStartGithubLink();
    const { data: project, isPending: projectPending } = useGetProject(projectId);
    const { data: link, isPending: linkPending } = useGithubLink();

    const isLoading = projectPending || linkPending;
    const githubLinked = needsLink ? false : Boolean(link);
    const role = project?.viewerRole ?? null;
    const canComment = role ? Permissions.project(role, Action.project.comment_review) : false;

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

    if (isLoading) return null;

    if (!canComment) {
        return (
            <div className="rounded-xl border border-border px-4 py-4 ml-8.5">
                <p className="text-[14.5px] text-neutral-400">
                    You don&apos;t have permission to comment on this pull request.
                </p>
            </div>
        );
    }

    if (!githubLinked) {
        return (
            <div className="flex flex-col items-start gap-2.5 rounded-xl border border-border px-4 py-4 ml-8.5">
                <p className="text-[14.5px] text-neutral-400">
                    Connect your GitHub account to reply as yourself.
                </p>
                <Button
                    size="sm"
                    variant="tertiary"
                    loading={startLink.isPending}
                    onClick={() => startLink.mutate()}
                >
                    <GithubLogoIcon />
                    Connect GitHub
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-xl border border-border bg-snow/2 focus-within:border-white/20 ml-8.5">
            <div className="max-h-32 overflow-y-auto px-3 pt-1.5" data-lenis-prevent>
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

            <div className="flex items-center justify-end gap-2 px-3 pb-1.5">
                {post.isError && (
                    <p className="mr-auto text-[13.5px] text-rose-400">
                        That comment didn&apos;t post. Try again.
                    </p>
                )}
                <Button
                    size="icon-xs"
                    className="bg-snow rounded-full"
                    disabled={isEmpty}
                    loading={post.isPending}
                    onClick={submit}
                >
                    <SendIcon />
                </Button>
            </div>
        </div>
    );
}
