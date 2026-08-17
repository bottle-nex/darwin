import type { ContentSummary } from "@trymatcha/editorial";
import EntryGrid from "./EntryGrid";

export default function BlogEntries({ entries }: { entries: ContentSummary[] }) {
    return <EntryGrid entries={entries} empty="No blog posts published yet." />;
}
