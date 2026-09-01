"use client";
import { BoardDataLoader, BoardFeedProvider } from "@/hooks/issues/useBoard";
import { useKanbanPane } from "@/hooks/kanban/useKanbanPane";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardScope } from "@/types/board";

import AddCustomColumnDialog from "./AddCustomColumnDialog";
import KanbanContent from "./KanbanContent";
import KanbanOptionsBar from "./OptionsBar/KanbanOptionsBar";

export default function KanbanDisplay({ scope }: { scope: BoardScope }) {
    const projectId = useActiveProject()?.id;

    return (
        <BoardFeedProvider projectId={projectId} scope={scope}>
            <KanbanDisplayContent projectId={projectId} scope={scope} />
        </BoardFeedProvider>
    );
}

function KanbanDisplayContent({
    projectId,
    scope,
}: {
    projectId: string | undefined;
    scope: BoardScope;
}) {
    useKanbanPane(scope);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <BoardDataLoader projectId={projectId} scope={scope} />
            <KanbanOptionsBar scope={scope} />
            <KanbanContent scope={scope} />
            <AddCustomColumnDialog />
        </div>
    );
}
