import { StatusTag, type ContentEntry } from "@trymatcha/editorial";
import { formatDate } from "@trymatcha/editorial";

function Dot() {
    return <span className="text-mist/20">·</span>;
}

export default function EntryByline({ entry }: { entry: ContentEntry }) {
    return (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-mist/40">
            {entry.version && (
                <>
                    <span className="font-mono tracking-widest text-primary">{entry.version}</span>
                    <Dot />
                </>
            )}

            {entry.channel && <StatusTag channel={entry.channel} />}

            {entry.author && (
                <>
                    <span className="text-mist/70">{entry.author}</span>
                    <Dot />
                </>
            )}

            <span>{entry.kind === "Changelog" ? "Changelog" : "Blog"}</span>
            <Dot />
            <span>{formatDate(entry.publishedAt)}</span>
            <Dot />
            <span>{entry.readingTime} min read</span>
        </div>
    );
}
