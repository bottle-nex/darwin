import type { ContentSummary } from "@trymatcha/editorial";

import EntryGrid from "./EntryGrid";

export default function ChangelogEntries({ entries }: { entries: ContentSummary[] }) {
    return <EntryGrid entries={entries} empty="No releases published yet." />;
}
