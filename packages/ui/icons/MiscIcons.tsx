import { createIcon } from "./createIcon";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { HiBars3CenterLeft, HiCalendar, HiOutlineArrowPath } from "react-icons/hi2";
import { MdAutorenew, MdEditCalendar, MdMoreHoriz, MdStar } from "react-icons/md";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";
import { RiLoader4Line } from "react-icons/ri";

export const CalendarIcon = createIcon(HiCalendar);

export const DownloadIcon = createIcon(FiDownload);

/** Setting a date, as opposed to `CalendarIcon`, which shows one. */
export const EditCalendarIcon = createIcon(MdEditCalendar);

export const GanttNavIcon = createIcon(HiBars3CenterLeft);

export const LoadingSpinnerIcon = createIcon(RiLoader4Line);

export const OverflowMenuIcon = createIcon(MdMoreHoriz);

export const OverflowMenuVerticalIcon = createIcon(PiDotsThreeOutlineVerticalLight);

export const ProcessingSpinnerIcon = createIcon(MdAutorenew);

export const ResponsePeriodMarkerIcon = createIcon(MdStar);

export const RetryActionIcon = createIcon(FiRefreshCw);

export const StatusChangedIcon = createIcon(HiOutlineArrowPath);
