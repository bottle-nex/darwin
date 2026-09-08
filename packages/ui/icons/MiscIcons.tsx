import { createIcon } from "./createIcon";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { HiBars3CenterLeft, HiCalendar, HiOutlineArrowPath } from "react-icons/hi2";
import { LuFileText, LuSparkles, LuSquareTerminal } from "react-icons/lu";
import { MdAutorenew, MdBlock, MdEditCalendar, MdMoreHoriz, MdStar, MdStop } from "react-icons/md";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";
import { RiLoader4Line } from "react-icons/ri";

export const AgentStepIcon = createIcon(LuSparkles);

export const CalendarIcon = createIcon(HiCalendar);

export const CommandIcon = createIcon(LuSquareTerminal);

/** A feature switched off, as opposed to `CancelledCardIcon`, which is a card's own state. */
export const DisabledIcon = createIcon(MdBlock);

export const DownloadIcon = createIcon(FiDownload);

/** Setting a date, as opposed to `CalendarIcon`, which shows one. */
export const EditCalendarIcon = createIcon(MdEditCalendar);

export const FileIcon = createIcon(LuFileText);

export const GanttNavIcon = createIcon(HiBars3CenterLeft);

export const LoadingSpinnerIcon = createIcon(RiLoader4Line);

export const OverflowMenuIcon = createIcon(MdMoreHoriz);

export const OverflowMenuVerticalIcon = createIcon(PiDotsThreeOutlineVerticalLight);

export const ProcessingSpinnerIcon = createIcon(MdAutorenew);

export const ResponsePeriodMarkerIcon = createIcon(MdStar);

export const RetryActionIcon = createIcon(FiRefreshCw);

export const StatusChangedIcon = createIcon(HiOutlineArrowPath);

/** Halting a stream in progress, as opposed to `PausedStateIcon`, which is a resting state. */
export const StopGenerationIcon = createIcon(MdStop);
