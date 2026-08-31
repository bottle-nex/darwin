import { createIcon } from "./createIcon";
import { HiOutlineInbox, HiOutlineTag, HiOutlineUserGroup, HiUsers } from "react-icons/hi2";
import { LuUser } from "react-icons/lu";
import { MdMyLocation } from "react-icons/md";

export const AssigneeGroupIcon = createIcon(HiUsers);

export const CreatorIcon = createIcon(LuUser);

export const InboxIcon = createIcon(HiOutlineInbox);

export const MyIssuesIcon = createIcon(MdMyLocation);

export const TagIcon = createIcon(HiOutlineTag);

export const TeamEntityIcon = createIcon(HiOutlineUserGroup);
