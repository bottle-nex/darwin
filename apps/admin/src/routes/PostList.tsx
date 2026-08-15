import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PostKind, PostStatus, ReleaseChannel } from "@trymatcha/types";
import { api, error_message } from "../lib/api";
import AdminSession from "../lib/session";
import { cn } from "../lib/cn";

type PostRow = {
    id: string;
    kind: PostKind;
    slug: string;
    title: string;
    summary: string | null;
    status: PostStatus;
    version: string | null;
    channel: ReleaseChannel | null;
    author: string | null;
    readingTime: number;
    publishedAt: string | null;
    updatedAt: string;
};

const FILTERS: Array<{ label: string; kind: PostKind | "All" }> = [
    { label: "All", kind: "All" },
    { label: "Blog", kind: "Blog" },
    { label: "Changelog", kind: "Changelog" },
];

export default function PostList() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostRow[]>([]);
    const [filter, setFilter] = useState<PostKind | "All">("All");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get("/admin/posts")
            .then(({ data }) => {
                if (!cancelled) setPosts(data.data);
            })
            .catch((err) => {
                if (!cancelled) setError(error_message(err, "Could not load posts."));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    async function remove(post: PostRow) {
        if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/posts/${post.id}`);
            setPosts((prev) => prev.filter((row) => row.id !== post.id));
        } catch (err) {
            setError(error_message(err, "Could not delete that post."));
        }
    }

    function signOut() {
        AdminSession.clear();
        navigate("/login", { replace: true });
    }

    const visible = filter === "All" ? posts : posts.filter((post) => post.kind === filter);

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-16">
            <header className="flex items-baseline justify-between">
                <div>
                    <h1 className="text-2xl tracking-tight text-snow">Content</h1>
                    <p className="mt-1 text-sm text-mist/40">{AdminSession.get_email()}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        to="/posts/new"
                        className="rounded-md bg-primary px-3 py-2 text-[14px] font-medium text-ink"
                    >
                        New post
                    </Link>
                    <button onClick={signOut} className="text-[13px] text-mist/40 hover:text-mist">
                        Sign out
                    </button>
                </div>
            </header>

            <nav className="mt-10 flex gap-2">
                {FILTERS.map((entry) => (
                    <button
                        key={entry.label}
                        onClick={() => setFilter(entry.kind)}
                        className={cn(
                            "rounded-full px-3 py-1 text-[13px] transition-colors",
                            filter === entry.kind
                                ? "bg-graphite text-snow"
                                : "text-mist/45 hover:text-mist",
                        )}
                    >
                        {entry.label}
                    </button>
                ))}
            </nav>

            {error && <p className="mt-6 text-[13px] text-red-400">{error}</p>}

            <div className="mt-6">
                {loading ? (
                    <p className="py-10 text-[14px] text-mist/35">Loading…</p>
                ) : visible.length === 0 ? (
                    <p className="py-10 text-[14px] text-mist/35">Nothing here yet.</p>
                ) : (
                    visible.map((post) => (
                        <article
                            key={post.id}
                            className="flex items-start justify-between gap-6 border-t border-graphite py-5"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-mist/35 uppercase">
                                    <span>{post.kind}</span>
                                    {post.version && (
                                        <span className="text-primary">{post.version}</span>
                                    )}
                                    {post.channel && <span>{post.channel}</span>}
                                    <span
                                        className={cn(
                                            post.status === "Published"
                                                ? "text-emerald-400"
                                                : "text-amber-400",
                                        )}
                                    >
                                        {post.status}
                                    </span>
                                </div>
                                <Link
                                    to={`/posts/${post.id}`}
                                    className="mt-1.5 block truncate text-[15px] text-snow hover:text-primary"
                                >
                                    {post.title}
                                </Link>
                                <p className="mt-1 truncate text-[13px] text-mist/40">
                                    /{post.slug}
                                </p>
                            </div>
                            <button
                                onClick={() => remove(post)}
                                className="shrink-0 text-[13px] text-mist/30 hover:text-red-400"
                            >
                                Delete
                            </button>
                        </article>
                    ))
                )}
            </div>
        </main>
    );
}
