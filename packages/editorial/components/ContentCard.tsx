import Link from "next/link";
import type { ContentSummary } from "../types";
import { formatDate } from "../lib/formatDate";
import { CardCover } from "./CardCover";
import { StatusTag } from "./StatusTag";

export function ContentCard({ entry, href }: { entry: ContentSummary; href: string }) {
    return (
        <Link
            href={href}
            className="group flex flex-col rounded-[10px] border border-graphite bg-linear-to-b from-charcoal to-ink p-3 transition-colors hover:border-edge"
        >
            <CardCover src={entry.coverImage} title={entry.title} version={entry.version} />

            <div className="flex flex-1 flex-col px-2 pt-5 pb-3">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 font-mono text-[11px] tracking-widest text-mist/35 uppercase">
                    {entry.version && <span className="text-primary">{entry.version}</span>}
                    {entry.channel && <StatusTag channel={entry.channel} />}
                    <span>{formatDate(entry.publishedAt)}</span>
                </div>

                <h2 className="mt-3 text-xl leading-snug tracking-tight text-snow transition-colors group-hover:text-primary">
                    {entry.title}
                </h2>

                {entry.summary && (
                    <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-mist/45">
                        {entry.summary}
                    </p>
                )}

                {(entry.author || entry.tags.length > 0) && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-1 font-mono text-[11px] tracking-widest text-mist/30 uppercase">
                        {entry.author && <span>{entry.author}</span>}
                        {entry.tags.map((tag) => (
                            <span key={tag} className="text-mist/25">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
