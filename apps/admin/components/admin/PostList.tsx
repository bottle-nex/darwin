"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostKind } from "@trydarwin/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePosts, useDeletePost, type PostRow } from "@/hooks/admin/usePosts";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ label: string; kind: PostKind | "All" }> = [
    { label: "All", kind: "All" },
    { label: "Blog", kind: "Blog" },
    { label: "Changelog", kind: "Changelog" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

function Row({ post, onDelete }: { post: PostRow; onDelete: (post: PostRow) => void }) {
    return (
        <article className="group flex items-start justify-between gap-6 border-b border-graphite py-5 transition-colors hover:bg-charcoal/40">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.18em] uppercase">
                    <span className="text-mist/30">{post.kind}</span>
                    {post.version && <span className="text-primary">{post.version}</span>}
                    {post.channel && <span className="text-mist/40">{post.channel}</span>}
                    <span
                        className={cn(
                            "rounded-full border px-1.5 py-0.5",
                            post.status === "Published"
                                ? "border-matcha/30 bg-matcha/10 text-matcha"
                                : "border-graphite bg-graphite text-mist/50",
                        )}
                    >
                        {post.status}
                    </span>
                </div>

                <Link
                    href={`/posts/${post.id}`}
                    className="mt-2 block truncate text-[15px] text-snow transition-colors hover:text-primary"
                >
                    {post.title}
                </Link>

                <p className="mt-1 truncate font-mono text-[11px] text-mist/30">
                    /{post.slug}
                    {post.publishedAt && ` · ${dateFormatter.format(new Date(post.publishedAt))}`}
                </p>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(post)}
                className="shrink-0 text-mist/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            >
                Delete
            </Button>
        </article>
    );
}

export default function PostList() {
    const [filter, setFilter] = useState<PostKind | "All">("All");
    const { data: posts, isPending, isError, error } = usePosts();
    const deletePost = useDeletePost();

    function handleDelete(post: PostRow) {
        if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
        deletePost.mutate(post.id, {
            onSuccess: () => toast.success("Post deleted"),
            onError: (err) => toast.error(getErrorMessage(err, "Could not delete that post.")),
        });
    }

    const visible = posts?.filter((post) => filter === "All" || post.kind === filter) ?? [];

    return (
        <>
            <header className="flex items-end justify-between pt-14">
                <div>
                    <h1 className="text-[2rem] leading-tight tracking-tight text-snow">Content</h1>
                    <p className="mt-1.5 text-sm text-mist/40">
                        Everything published to the blog and changelog.
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/posts/new">New post</Link>
                </Button>
            </header>

            <nav className="mt-10 flex gap-x-1.5">
                {FILTERS.map((entry) => (
                    <button
                        key={entry.label}
                        onClick={() => setFilter(entry.kind)}
                        className={cn(
                            "cursor-pointer rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                            filter === entry.kind
                                ? "bg-graphite text-snow"
                                : "text-mist/35 hover:text-mist",
                        )}
                    >
                        {entry.label}
                    </button>
                ))}
            </nav>

            <div className="mt-8 border-t border-graphite">
                {isPending ? (
                    <p className="py-12 text-[14px] text-mist/30">Loading…</p>
                ) : isError ? (
                    <p className="py-12 text-[14px] text-destructive">
                        {getErrorMessage(error, "Could not load posts.")}
                    </p>
                ) : visible.length === 0 ? (
                    <p className="py-12 text-[14px] text-mist/30">Nothing here yet.</p>
                ) : (
                    visible.map((post) => <Row key={post.id} post={post} onDelete={handleDelete} />)
                )}
            </div>
        </>
    );
}
