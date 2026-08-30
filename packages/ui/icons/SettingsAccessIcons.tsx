import { createIcon } from "./createIcon";
import { GoHubot } from "react-icons/go";
import {
    HiOutlineArrowLeft,
    HiOutlineArrowsRightLeft,
    HiOutlineBriefcase,
    HiOutlineCheckBadge,
    HiOutlineCog6Tooth,
    HiOutlineCommandLine,
    HiOutlineDocumentText,
    HiOutlineFolder,
    HiOutlineHashtag,
    HiOutlineKey,
    HiOutlineLockClosed,
    HiOutlineNoSymbol,
    HiOutlinePaintBrush,
    HiOutlineRectangleGroup,
    HiOutlineRectangleStack,
    HiOutlineSquare3Stack3D,
    HiOutlineUserMinus,
    HiOutlineUserPlus,
} from "react-icons/hi2";
import { MdKey, MdPersonOff, MdRemove, MdVerifiedUser, MdVpnKey } from "react-icons/md";
import { TbLayoutSidebarFilled } from "react-icons/tb";

export const AccessChangedIcon = createIcon(HiOutlineKey);

export const AccessRestrictedIcon = createIcon(HiOutlineLockClosed);

export const ApiKeyIcon = createIcon(MdKey);

export const ChangeRoleIcon = createIcon(MdVerifiedUser);

export const CommandMenuIcon = createIcon(HiOutlineCommandLine);

export const EnvSecretIcon = createIcon(MdVpnKey);

export const HarnessIcon = createIcon(GoHubot);

export const InviteAcceptedIcon = createIcon(HiOutlineCheckBadge);

export const IssueAssignedIcon = createIcon(HiOutlineUserPlus);

export const IssueEntityIcon = createIcon(HiOutlineRectangleStack);

export const IssueMovedIcon = createIcon(HiOutlineArrowsRightLeft);

export const IssueReferencedIcon = createIcon(HiOutlineHashtag);

export const OrganizationEntityIcon = createIcon(HiOutlineBriefcase);

export const OtpSeparatorIcon = createIcon(MdRemove);

export const PersonRemovedNotificationIcon = createIcon(HiOutlineUserMinus);

export const ProjectEntityIcon = createIcon(HiOutlineFolder);

export const ProjectReferenceIcon = createIcon(HiOutlineRectangleGroup);

export const RemoveMemberIcon = createIcon(MdPersonOff);

export const RemovedFromOrgIcon = createIcon(HiOutlineNoSymbol);

export const SettingsApiKeysIcon = createIcon(HiOutlineSquare3Stack3D);

export const SettingsAppearanceIcon = createIcon(HiOutlinePaintBrush);

export const SettingsBackIcon = createIcon(HiOutlineArrowLeft);

export const SettingsIcon = createIcon(HiOutlineCog6Tooth);

export const SettingsTemplatesIcon = createIcon(HiOutlineDocumentText);

export const SidebarToggleIcon = createIcon(TbLayoutSidebarFilled);
