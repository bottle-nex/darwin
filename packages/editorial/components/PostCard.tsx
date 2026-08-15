import Link from "next/link";
import type { ContentSummary } from "../types";
import { formatDate } from "../lib/formatDate";

export function PostCard({ post, href }: { post: ContentSummary; href: string }) {
    return (
        <Link
            href={href}
            className="group grid grid-cols-1 gap-y-3 border-t border-graphite py-8 md:grid-cols-12 md:gap-x-10"
        >
            <div className="md:col-span-3">
                <span className="font-mono text-xs tracking-widest text-mist/40">
                    {formatDate(post.publishedAt)}
                </span>
            </div>

            <div className="md:col-span-9">
                <h2 className="max-w-[680px] text-xl leading-snug tracking-tight text-snow transition-colors group-hover:text-primary">
                    {post.title}
                </h2>
                {post.summary && (
                    <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-mist/50">
                        {post.summary}
                    </p>
                )}
                {post.author && (
                    <span className="mt-4 inline-block font-mono text-[11px] tracking-widest text-mist/30 uppercase">
                        {post.author}
                    </span>
                )}
            </div>
        </Link>
    );
}
