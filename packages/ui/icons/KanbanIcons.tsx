import { createIcon } from "./createIcon";
import { LuArrowUpDown, LuColumns3, LuEye, LuListFilter, LuShare2 } from "react-icons/lu";
import { HiViewGridAdd } from "react-icons/hi";
import {
    MdAccessTimeFilled,
    MdAutoAwesome,
    MdList,
    MdOutlineKeyboardOptionKey,
    MdSortByAlpha,
    MdVerticalSplit,
    MdViewKanban,
    MdWindow,
} from "react-icons/md";

export const AgentIcon = createIcon(MdAutoAwesome);

export const BoardSplitViewIcon = createIcon(MdVerticalSplit);

export const BoardViewIcon = createIcon(LuEye);

export const ClockIcon = createIcon(MdAccessTimeFilled);

export const DefaultFocusIcon = createIcon(MdWindow);

export const FilterIcon = createIcon(LuListFilter);

export const KanbanBoardLayoutIcon = createIcon(MdViewKanban);

export const KanbanColumnsIcon = createIcon(LuColumns3);

export const KanbanListViewIcon = createIcon(MdList);

export const OptionsMenuIcon = createIcon(HiViewGridAdd);

export const ShareIcon = createIcon(LuShare2);

export const SortAlphabeticalIcon = createIcon(MdSortByAlpha);

export const SortIcon = createIcon(LuArrowUpDown);
