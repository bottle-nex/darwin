import { createIcon } from "./createIcon";
import { BsArrowDownShort } from "react-icons/bs";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { IoArrowBackSharp } from "react-icons/io5";
import { LuChevronDown, LuChevronUp, LuChevronsUpDown, LuSearch } from "react-icons/lu";
import {
    MdArrowBack,
    MdChevronLeft,
    MdChevronRight,
    MdKeyboardArrowDown,
    MdKeyboardArrowUp,
    MdOutlineKeyboardArrowRight,
    MdSearch,
} from "react-icons/md";
import { PiArrowRight } from "react-icons/pi";
import { RxTriangleRight } from "react-icons/rx";

export const BlogBackNavIcon = createIcon(MdArrowBack);

export const BreadcrumbSeparatorIcon = createIcon(MdOutlineKeyboardArrowRight);

export const CalendarNavNextIcon = createIcon(MdChevronRight);

export const CalendarNavPrevIcon = createIcon(MdChevronLeft);

export const CommandBackIcon = createIcon(HiOutlineArrowLeft);

export const CtaArrowIcon = createIcon(MdChevronRight);

export const DiffExpandIcon = createIcon(LuChevronsUpDown);

export const DropdownCaretIcon = createIcon(MdKeyboardArrowDown);

export const DropdownCaretUpIcon = createIcon(MdKeyboardArrowUp);

export const EnterArrowIcon = createIcon(IoArrowBackSharp);

export const FooterLinkHoverArrowIcon = createIcon(BsArrowDownShort);

export const NavCtaArrowIcon = createIcon(PiArrowRight);

export const SearchIcon = createIcon(MdSearch);

export const SearchToggleIcon = createIcon(LuSearch);

export const StepperDecrementIcon = createIcon(LuChevronDown);

export const StepperIncrementIcon = createIcon(LuChevronUp);

export const SubmenuDisclosureIcon = createIcon(RxTriangleRight);

export const SwitcherToggleIcon = createIcon(LuChevronsUpDown);
