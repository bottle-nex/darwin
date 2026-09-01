import { createIcon } from "./createIcon";
import { HiOutlineUserGroup, HiTag, HiUsers } from "react-icons/hi2";
import { LuUser } from "react-icons/lu";
import { MdAssignmentInd, MdInbox } from "react-icons/md";
import { PiUserFocusFill } from "react-icons/pi";

export const AssigneeGroupIcon = createIcon(HiUsers);

export const CreatorIcon = createIcon(LuUser);

export const InboxIcon = createIcon(MdInbox);

export const MyIssuesIcon = createIcon(MdAssignmentInd);

export const TagIcon = createIcon(HiTag);

export const TeamEntityIcon = createIcon(HiOutlineUserGroup);
