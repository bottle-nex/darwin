import { createIcon } from "./createIcon";
import {
    HiChatBubbleBottomCenterText,
    HiCpuChip,
    HiOutlineAtSymbol,
    HiOutlineFaceSmile,
} from "react-icons/hi2";
import { MdChat } from "react-icons/md";
import { PiSmileyFill } from "react-icons/pi";
import { RiLeafFill, RiSendPlane2Fill } from "react-icons/ri";

export const AskDarwinIcon = createIcon(HiCpuChip);

export const ChatsNavIcon = createIcon(HiChatBubbleBottomCenterText);

export const DarwinChatIcon = createIcon(RiLeafFill);

export const CommentCountIcon = createIcon(MdChat);

export const EmojiReactionIcon = createIcon(HiOutlineFaceSmile);

export const MentionIcon = createIcon(HiOutlineAtSymbol);

export const ProjectAvatarPickerIcon = createIcon(PiSmileyFill);

export const SendIcon = createIcon(RiSendPlane2Fill);
