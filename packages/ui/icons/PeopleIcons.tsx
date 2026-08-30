import { createIcon } from "./createIcon";
import { HiOutlineInbox, HiOutlineTag, HiOutlineUserGroup } from "react-icons/hi2";
import { LuClipboardList, LuUser, LuUsers } from "react-icons/lu";

export const AssigneeGroupIcon = createIcon(LuUsers);

export const CreatorIcon = createIcon(LuUser);

export const InboxIcon = createIcon(HiOutlineInbox);

export const MyIssuesIcon = createIcon(LuClipboardList);

export const TagIcon = createIcon(HiOutlineTag);

export const TeamEntityIcon = createIcon(HiOutlineUserGroup);
