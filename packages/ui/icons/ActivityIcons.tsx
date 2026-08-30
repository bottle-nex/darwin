import { createIcon } from "./createIcon";
import { FaRunning } from "react-icons/fa";
import { LuActivity, LuAlignLeft } from "react-icons/lu";
import { MdPersonAddAlt1, MdPersonRemove } from "react-icons/md";
import { RiSignalCellular2Fill } from "react-icons/ri";
import { TbSoupFilled } from "react-icons/tb";

export const AssigneeAddedActivityIcon = createIcon(MdPersonAddAlt1);

export const AssigneeRemovedActivityIcon = createIcon(MdPersonRemove);

export const DescriptionChangedActivityIcon = createIcon(LuAlignLeft);

export const PriorityChangedActivityIcon = createIcon(RiSignalCellular2Fill);

export const RunCompletedActivityIcon = createIcon(TbSoupFilled);

export const RunStartedActivityIcon = createIcon(FaRunning);

export const UntrackedActivityIcon = createIcon(LuActivity);
