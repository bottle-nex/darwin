import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { PostKind, ReleaseChannel } from "@trymatcha/types";
import RichTextEditor from "../components/editor/RichTextEditor";
import { api, error_message } from "../lib/api";
import { cn } from "../lib/cn";

const FIELD_CLASS =
    "w-full rounded-md border border-graphite bg-charcoal px-3 py-2 text-[14px] text-mist outline-none focus:border-primary/40";

const LABEL_CLASS = "font-mono text-[11px] tracking-widest text-mist/35 uppercase";

export default function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [kind, setKind] = useState<PostKind>("Blog");
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [summary, setSummary] = useState("");
    const [author, setAuthor] = useState("");
    const [tags, setTags] = useState("");
    const [version, setVersion] = useState("");
    const [channel, setChannel] = useState<ReleaseChannel>("Beta");
    const [coverImage, setCoverImage] = useState("");
    const [published, setPublished] = useState(false);

    const [content, setContent] = useState("");
    const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
    const [bodyEmpty, setBodyEmpty] = useState(true);
    const [ready, setReady] = useState(!isEdit);

    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        api.get(`/admin/posts/${id}`)
            .then(({ data }) => {
                if (cancelled) return;
                const post = data.data;
                setKind(post.kind);
                setTitle(post.title);
                setSlug(post.slug);
                setSummary(post.summary ?? "");
                setAuthor(post.author ?? "");
                setTags((post.tags ?? []).join(", "));
                setVersion(post.version ?? "");
                setChannel(post.channel ?? "Beta");
                setCoverImage(post.coverImage ?? "");
                setPublished(post.status === "Published");
                setInitialContent(post.content);
                setContent(post.content);
                setReady(true);
            })
            .catch((err) => {
                if (!cancelled) setError(error_message(err, "Could not load that post."));
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    async function save() {
        setPending(true);
        setError(null);

        const body = {
            kind,
            title: title.trim(),
            slug: slug.trim() || undefined,
            summary: summary.trim() || undefined,
            author: author.trim() || undefined,
            coverImage: coverImage.trim() || undefined,
            tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            version: kind === "Changelog" ? version.trim() || undefined : undefined,
            channel: kind === "Changelog" ? channel : undefined,
            content,
            status: published ? "Published" : "Draft",
        };

        try {
            if (isEdit) {
                await api.patch(`/admin/posts/${id}`, body);
            } else {
                await api.post("/admin/posts", body);
            }
            navigate("/", { replace: true });
        } catch (err) {
            setError(error_message(err, "Could not save that post."));
        } finally {
            setPending(false);
        }
    }

    const canSave = title.trim().length > 0 && !bodyEmpty && !pending;

    if (!ready) {
        return <main className="px-6 py-16 text-[14px] text-mist/35">Loading…</main>;
    }

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-12">
            <header className="flex items-center justify-between">
                <Link to="/" className="text-[13px] text-mist/40 hover:text-mist">
                    ← Content
                </Link>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px] text-mist/60">
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(event) => setPublished(event.target.checked)}
                        />
                        Published
                    </label>
                    <button
                        onClick={save}
                        disabled={!canSave}
                        className="rounded-md bg-primary px-3 py-2 text-[14px] font-medium text-ink disabled:opacity-40"
                    >
                        {pending ? "Saving…" : "Save"}
                    </button>
                </div>
            </header>

            {error && <p className="mt-6 text-[13px] text-red-400">{error}</p>}

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Kind</span>
                    <select
                        value={kind}
                        onChange={(event) => setKind(event.target.value as PostKind)}
                        className={FIELD_CLASS}
                    >
                        <option value="Blog">Blog</option>
                        <option value="Changelog">Changelog</option>
                    </select>
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Slug</span>
                    <input
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        placeholder="derived from the title"
                        className={FIELD_CLASS}
                    />
                </label>

                {kind === "Changelog" && (
                    <>
                        <label className="flex flex-col gap-1.5">
                            <span className={LABEL_CLASS}>Version</span>
                            <input
                                value={version}
                                onChange={(event) => setVersion(event.target.value)}
                                placeholder="0.2.0"
                                className={FIELD_CLASS}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={LABEL_CLASS}>Channel</span>
                            <select
                                value={channel}
                                onChange={(event) =>
                                    setChannel(event.target.value as ReleaseChannel)
                                }
                                className={FIELD_CLASS}
                            >
                                <option value="Beta">Beta</option>
                                <option value="Stable">Stable</option>
                            </select>
                        </label>
                    </>
                )}

                {kind === "Blog" && (
                    <>
                        <label className="flex flex-col gap-1.5">
                            <span className={LABEL_CLASS}>Author</span>
                            <input
                                value={author}
                                onChange={(event) => setAuthor(event.target.value)}
                                className={FIELD_CLASS}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={LABEL_CLASS}>Tags</span>
                            <input
                                value={tags}
                                onChange={(event) => setTags(event.target.value)}
                                placeholder="comma, separated"
                                className={FIELD_CLASS}
                            />
                        </label>
                    </>
                )}

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className={LABEL_CLASS}>Cover image URL</span>
                    <input
                        value={coverImage}
                        onChange={(event) => setCoverImage(event.target.value)}
                        className={FIELD_CLASS}
                    />
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className={LABEL_CLASS}>Summary</span>
                    <input
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        className={FIELD_CLASS}
                    />
                </label>
            </div>

            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="mt-10 w-full bg-transparent text-[2rem] leading-tight tracking-tight text-snow outline-none placeholder:text-mist/20"
            />

            <div className={cn("relative mt-6 min-h-[50vh]")}>
                <RichTextEditor
                    initialContent={initialContent}
                    onChange={(next) => {
                        setContent(next.html);
                        setBodyEmpty(next.isEmpty);
                    }}
                />
                <aside data-slot="slash-command-portal" className="pointer-events-none" />
            </div>

            <p className="mt-10 font-mono text-[11px] tracking-widest text-mist/25 uppercase">
                / for commands · ⌘B bold · Esc closes the menu
            </p>
        </main>
    );
}
