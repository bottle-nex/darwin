import { createIcon } from "./createIcon";
import {
    LuBold,
    LuCalendarClock,
    LuCode,
    LuFingerprint,
    LuHash,
    LuHeading,
    LuHeading1,
    LuHeading2,
    LuHeading3,
    LuImage,
    LuItalic,
    LuLink,
    LuList,
    LuListCollapse,
    LuListOrdered,
    LuListTodo,
    LuListTree,
    LuMinus,
    LuQuote,
    LuStrikethrough,
    LuTable,
    LuType,
    LuUnderline,
} from "react-icons/lu";
import { TbFileInvoiceFilled } from "react-icons/tb";

export const BlockquoteFormatIcon = createIcon(LuQuote);

export const BoldFormatIcon = createIcon(LuBold);

export const BulletListIcon = createIcon(LuList);

export const ChecklistFormatIcon = createIcon(LuListTodo);

export const CodeFormatIcon = createIcon(LuCode);

export const CopyFieldIdIcon = createIcon(LuFingerprint);

export const CopyFieldMarkdownIcon = createIcon(TbFileInvoiceFilled);

export const CopyFieldNumberIcon = createIcon(LuHash);

export const CopyFieldTitleIcon = createIcon(LuType);

export const CopyFieldUrlIcon = createIcon(LuLink);

export const DateTimeInsertIcon = createIcon(LuCalendarClock);

export const DividerIcon = createIcon(LuMinus);

export const Heading1Icon = createIcon(LuHeading1);

export const Heading2Icon = createIcon(LuHeading2);

export const Heading3Icon = createIcon(LuHeading3);

export const HeadingGroupIcon = createIcon(LuHeading);

export const ItalicFormatIcon = createIcon(LuItalic);

export const LinkFormatIcon = createIcon(LuLink);

export const ListGroupIcon = createIcon(LuListTree);

export const MediaInsertIcon = createIcon(LuImage);

export const NumberedListIcon = createIcon(LuListOrdered);

export const StrikethroughFormatIcon = createIcon(LuStrikethrough);

export const TableInsertIcon = createIcon(LuTable);

export const TextParagraphIcon = createIcon(LuMinus);

export const ToggleListIcon = createIcon(LuListCollapse);

export const UnderlineFormatIcon = createIcon(LuUnderline);
