import { createIcon } from "./createIcon";
import { HiOutlineInbox, HiOutlineTag, HiOutlineUserGroup } from "react-icons/hi2";
import { LuUser, LuUsers } from "react-icons/lu";
import { MdMyLocation } from "react-icons/md";

export const AssigneeGroupIcon = createIcon(LuUsers);

export const CreatorIcon = createIcon(LuUser);

export const InboxIcon = createIcon(HiOutlineInbox);

export const MyIssuesIcon = createIcon(MdMyLocation);

export const TagIcon = createIcon(HiOutlineTag);

export const TeamEntityIcon = createIcon(HiOutlineUserGroup);
