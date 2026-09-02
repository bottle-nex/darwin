import { DiffView } from "@trymatcha/types";
import { CapsuleSplitViewIcon, type IconType, KanbanListViewIcon } from "@trymatcha/ui/icons";

export const DIFF_VIEWS: { value: DiffView; label: string; icon: IconType }[] = [
    { value: DiffView.Unified, label: "Unified", icon: KanbanListViewIcon },
    { value: DiffView.Split, label: "Split", icon: CapsuleSplitViewIcon },
];
