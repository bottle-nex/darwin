import { createIcon } from "./createIcon";
import {
    HiOutlineArrowLeft,
    HiOutlineArrowsRightLeft,
    HiOutlineBellAlert,
    HiOutlineBriefcase,
    HiOutlineCheckBadge,
    HiOutlineCog6Tooth,
    HiOutlineCommandLine,
    HiOutlineComputerDesktop,
    HiDocumentText,
    HiOutlineFolder,
    HiOutlineHashtag,
    HiOutlineKey,
    HiLockClosed,
    HiOutlineMoon,
    HiOutlineNoSymbol,
    HiOutlineRectangleGroup,
    HiOutlineRectangleStack,
    HiOutlineSun,
    HiSquare3Stack3D,
    HiPuzzlePiece,
    HiRectangleStack,
    HiSquares2X2,
    HiOutlineUserMinus,
    HiOutlineUserPlus,
} from "react-icons/hi2";
import { RiPaintBrushFill } from "react-icons/ri";
import { IoIosSettings, IoMdSettings } from "react-icons/io";
import {
    MdKey,
    MdOutlineSupportAgent,
    MdPersonOff,
    MdRemove,
    MdVerifiedUser,
    MdVpnKey,
} from "react-icons/md";
import { TbLayoutSidebarFilled } from "react-icons/tb";

export const AccessChangedIcon = createIcon(HiOutlineKey);

export const AccessRestrictedIcon = createIcon(HiLockClosed);

export const ApiKeyIcon = createIcon(MdKey);

export const ChangeRoleIcon = createIcon(MdVerifiedUser);

export const CommandMenuIcon = createIcon(HiOutlineCommandLine);

export const EnvSecretIcon = createIcon(MdVpnKey);

export const HarnessIcon = createIcon(MdOutlineSupportAgent);

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

export const SpaceEntityIcon = createIcon(HiRectangleStack);

export const RemoveMemberIcon = createIcon(MdPersonOff);

export const RemovedFromOrgIcon = createIcon(HiOutlineNoSymbol);

export const SettingsApiKeysIcon = createIcon(HiSquare3Stack3D);

export const SettingsAppearanceIcon = createIcon(RiPaintBrushFill);

export const SettingsBackIcon = createIcon(HiOutlineArrowLeft);

export const SettingsIcon = createIcon(IoMdSettings);

export const SettingsIntegrationsIcon = createIcon(HiPuzzlePiece);

export const SettingsConnectorsIcon = createIcon(HiOutlineBellAlert);

export const SettingsOverviewIcon = createIcon(HiSquares2X2);

export const SettingsTemplatesIcon = createIcon(HiDocumentText);

export const SidebarToggleIcon = createIcon(TbLayoutSidebarFilled);

export const ThemeDarkIcon = createIcon(HiOutlineMoon);

export const ThemeLightIcon = createIcon(HiOutlineSun);

export const ThemeSystemIcon = createIcon(HiOutlineComputerDesktop);
