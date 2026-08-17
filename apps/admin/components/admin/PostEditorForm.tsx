"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostKind, ReleaseChannel } from "@trymatcha/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
    useCreatePost,
    useUpdatePost,
    usePost,
    type PostDetail,
    type PostInput,
} from "@/hooks/admin/usePosts";
import { getErrorMessage } from "@/lib/api";

const LABEL_CLASS = "font-mono text-[10px] tracking-[0.18em] text-mist/35 uppercase";

const SELECT_CLASS =
    "h-9 w-full rounded-md border border-graphite bg-charcoal px-3 text-[14px] text-mist outline-none focus:border-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-y-2">
            <Label className={LABEL_CLASS}>{label}</Label>
            {children}
        </div>
    );
}

export default function PostEditorForm({ id }: { id?: string }) {
    const { data: existing, isPending } = usePost(id);

    if (id && isPending) {
        return <p className="py-16 text-[14px] text-mist/30">Loading…</p>;
    }

    return <PostForm id={id} existing={existing} />;
}

function PostForm({ id, existing }: { id?: string; existing?: PostDetail }) {
    const router = useRouter();
    const isEdit = Boolean(id);

    const createPost = useCreatePost();
    const updatePost = useUpdatePost(id ?? "");

    const [kind, setKind] = useState<PostKind>(existing?.kind ?? "Blog");
    const [title, setTitle] = useState(existing?.title ?? "");
    const [slug, setSlug] = useState(existing?.slug ?? "");
    const [summary, setSummary] = useState(existing?.summary ?? "");
    const [author, setAuthor] = useState(existing?.author ?? "");
    const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
    const [version, setVersion] = useState(existing?.version ?? "");
    const [channel, setChannel] = useState<ReleaseChannel>(existing?.channel ?? "Beta");
    const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "");
    const [published, setPublished] = useState(existing?.status === "Published");

    const [content, setContent] = useState(existing?.content ?? "");
    const [bodyEmpty, setBodyEmpty] = useState(!existing?.content);

    const pending = createPost.isPending || updatePost.isPending;
    const canSave = title.trim().length > 0 && !bodyEmpty && !pending;

    function save() {
        const input: PostInput = {
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

        const mutation = isEdit ? updatePost : createPost;
        mutation.mutate(input, {
            onSuccess: () => {
                toast.success(isEdit ? "Post updated" : "Post created");
                router.push("/");
            },
            onError: (err) => toast.error(getErrorMessage(err, "Could not save that post.")),
        });
    }

    return (
        <>
            <header className="flex items-center justify-between border-b border-graphite py-5">
                <Link
                    href="/"
                    className="font-mono text-[11px] tracking-[0.18em] text-mist/40 uppercase transition-colors hover:text-snow"
                >
                    ← Content
                </Link>
                <div className="flex items-center gap-x-5">
                    <label className="flex cursor-pointer items-center gap-x-2.5">
                        <Switch checked={published} onCheckedChange={setPublished} />
                        <span className={LABEL_CLASS}>{published ? "Published" : "Draft"}</span>
                    </label>
                    <Button size="lg" onClick={save} disabled={!canSave} loading={pending}>
                        Save
                    </Button>
                </div>
            </header>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <Field label="Kind">
                    <select
                        value={kind}
                        onChange={(event) => setKind(event.target.value as PostKind)}
                        className={SELECT_CLASS}
                    >
                        <option value="Blog">Blog</option>
                        <option value="Changelog">Changelog</option>
                    </select>
                </Field>

                <Field label="Slug">
                    <Input
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        placeholder="derived from the title"
                    />
                </Field>

                {kind === "Changelog" ? (
                    <>
                        <Field label="Version">
                            <Input
                                value={version}
                                onChange={(event) => setVersion(event.target.value)}
                                placeholder="0.2.0"
                            />
                        </Field>
                        <Field label="Channel">
                            <select
                                value={channel}
                                onChange={(event) =>
                                    setChannel(event.target.value as ReleaseChannel)
                                }
                                className={SELECT_CLASS}
                            >
                                <option value="Beta">Beta</option>
                                <option value="Stable">Stable</option>
                            </select>
                        </Field>
                    </>
                ) : (
                    <>
                        <Field label="Author">
                            <Input
                                value={author}
                                onChange={(event) => setAuthor(event.target.value)}
                            />
                        </Field>
                        <Field label="Tags">
                            <Input
                                value={tags}
                                onChange={(event) => setTags(event.target.value)}
                                placeholder="comma, separated"
                            />
                        </Field>
                    </>
                )}

                <div className="sm:col-span-2">
                    <Field label="Cover image URL">
                        <Input
                            value={coverImage}
                            onChange={(event) => setCoverImage(event.target.value)}
                        />
                    </Field>
                </div>

                <div className="sm:col-span-2">
                    <Field label="Summary">
                        <Input
                            value={summary}
                            onChange={(event) => setSummary(event.target.value)}
                        />
                    </Field>
                </div>
            </div>

            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="mt-12 w-full bg-transparent text-[2rem] leading-tight tracking-tight text-snow outline-none placeholder:text-mist/15"
            />

            <div className="relative mt-6 min-h-[50vh]">
                <RichTextEditor
                    initialContent={existing?.content}
                    onChange={(next) => {
                        setContent(next.html);
                        setBodyEmpty(next.isEmpty);
                    }}
                />
                <aside data-slot="slash-command-portal" className="pointer-events-none" />
            </div>

            <p className="mt-12 font-mono text-[10px] tracking-[0.18em] text-mist/20 uppercase">
                / for commands · ⌘B bold · Esc closes the menu
            </p>
        </>
    );
}
