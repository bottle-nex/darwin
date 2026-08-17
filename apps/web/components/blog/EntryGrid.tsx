import { ContentCard, type ContentSummary } from "@trymatcha/editorial";

type EntryGridProps = {
    entries: ContentSummary[];
    empty: string;
};

export default function EntryGrid({ entries, empty }: EntryGridProps) {
    if (entries.length === 0) {
        return <p className="py-16 text-[15px] text-mist/30">{empty}</p>;
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {entries.map((entry) => (
                <ContentCard key={entry.slug} entry={entry} href={`/blog/${entry.slug}`} />
            ))}
        </div>
    );
}
