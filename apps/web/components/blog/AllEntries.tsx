import type { ContentSummary } from "@trydarwin/editorial";

import EntryGrid from "./EntryGrid";

export default function AllEntries({ entries }: { entries: ContentSummary[] }) {
    return <EntryGrid entries={entries} empty="Nothing published yet." />;
}
