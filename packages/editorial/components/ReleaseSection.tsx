import Link from "next/link";
import type { ContentEntry } from "../types";
import { formatDate } from "../lib/formatDate";
import { Prose } from "./Prose";
import { StatusTag } from "./StatusTag";

type ReleaseSectionProps = {
    release: ContentEntry;
    href?: string;
};

export function ReleaseSection({ release, href }: ReleaseSectionProps) {
    return (
        <article className="grid grid-cols-1 gap-y-5 md:grid-cols-12 md:gap-x-10">
            <div className="md:col-span-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:sticky md:top-28 md:flex-col md:items-start md:gap-y-2.5">
                    {release.version && (
                        <span className="font-mono text-xs tracking-widest text-snow">
                            {release.version}
                        </span>
                    )}
                    <span className="font-mono text-xs tracking-widest text-mist/40">
                        {formatDate(release.publishedAt)}
                    </span>
                    {release.channel && <StatusTag channel={release.channel} />}
                </div>
            </div>

            <div className="md:col-span-9">
                <h2 className="max-w-[680px] text-2xl leading-snug tracking-tight text-snow">
                    {href ? (
                        <Link href={href} className="transition-colors hover:text-primary">
                            {release.title}
                        </Link>
                    ) : (
                        release.title
                    )}
                </h2>
                <Prose className="mt-5" html={release.content} />
            </div>
        </article>
    );
}
