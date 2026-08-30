import { createIcon } from "./createIcon";
import { BsArrowReturnRight, BsBarChartSteps, BsKanban, BsListUl } from "react-icons/bs";
import { FaDiscord, FaPhoneAlt } from "react-icons/fa";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { IoIosPlayCircle } from "react-icons/io";
import {
    LuAlarmClock,
    LuBot,
    LuChartLine,
    LuCornerDownRight,
    LuInbox,
    LuPaperclip,
    LuSettings,
    LuSquareKanban,
    LuSquareTerminal,
} from "react-icons/lu";
import { RiRocketFill, RiSlackFill, RiTeamFill } from "react-icons/ri";
import { SiJira, SiLinear, SiNotion } from "react-icons/si";

export const AttachmentCountIcon = createIcon(LuPaperclip);

export const CtaGetStartedIcon = createIcon(RiRocketFill);

export const CtaMeetTeamIcon = createIcon(RiTeamFill);

export const DiscordLogoIcon = createIcon(FaDiscord);

export const JiraLogoIcon = createIcon(SiJira);

export const LinearLogoIcon = createIcon(SiLinear);

export const LinkedInLogoIcon = createIcon(FaLinkedinIn);

export const NotionLogoIcon = createIcon(SiNotion);

export const PhoneContactIcon = createIcon(FaPhoneAlt);

export const PlatformAgentsIcon = createIcon(LuBot);

export const PlatformBoardIcon = createIcon(LuSquareKanban);

export const PlatformInboxIcon = createIcon(LuInbox);

export const PlatformInsightsIcon = createIcon(LuChartLine);

export const PlatformRunnersIcon = createIcon(LuSquareTerminal);

export const PlatformSettingsIcon = createIcon(LuSettings);

export const PlayCircleIcon = createIcon(IoIosPlayCircle);

export const ShowcaseDueDateIcon = createIcon(LuAlarmClock);

export const ShowcaseKanbanViewIcon = createIcon(BsKanban);

export const ShowcaseListViewIcon = createIcon(BsListUl);

export const ShowcaseReplyIndicatorIcon = createIcon(LuCornerDownRight);

export const ShowcaseSubtaskCountIcon = createIcon(BsArrowReturnRight);

export const ShowcaseTimelineViewIcon = createIcon(BsBarChartSteps);

export const SlackLogoIcon = createIcon(RiSlackFill);

export const XLogoIcon = createIcon(FaXTwitter);
