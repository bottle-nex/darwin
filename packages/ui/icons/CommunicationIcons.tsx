import { createIcon } from "./createIcon";
import { HiOutlineAtSymbol,HiOutlineFaceSmile } from "react-icons/hi2";
import { MdChat } from "react-icons/md";
import { PiSmileyFill } from "react-icons/pi";
import { RiSendPlane2Fill } from "react-icons/ri";
import { BiSolidChat } from "react-icons/bi";
import { VscMcp } from "react-icons/vsc";

export const AskDarwinIcon = createIcon(VscMcp);

export const ChatsNavIcon = createIcon(BiSolidChat);

export const CommentCountIcon = createIcon(MdChat);

export const EmojiReactionIcon = createIcon(HiOutlineFaceSmile);

export const MentionIcon = createIcon(HiOutlineAtSymbol);

export const ProjectAvatarPickerIcon = createIcon(PiSmileyFill);

export const SendIcon = createIcon(RiSendPlane2Fill);
