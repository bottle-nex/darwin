import { BiSolidCopy } from "react-icons/bi";
import { createIcon } from "./createIcon";
import { BsReply } from "react-icons/bs";
import { GrReturn } from "react-icons/gr";
import { HiPencilSquare, HiUserPlus } from "react-icons/hi2";
import { IoPencilSharp } from "react-icons/io5";
import { LuCopyPlus, LuExternalLink, LuUserPlus } from "react-icons/lu";
import {
    MdAdd,
    MdCheck,
    MdChecklist,
    MdClose,
    MdColorize,
    MdDelete,
    MdDragIndicator,
    MdEdit,
    MdJoinLeft,
    MdLogout,
    MdOutlineKeyboardCommandKey,
    MdPersonRemove,
    MdPlaylistAdd,
    MdStorage,
    MdUpload,
    MdVisibility,
    MdVisibilityOff,
    MdZoomOutMap,
} from "react-icons/md";

export const AddCustomColumnIcon = createIcon(MdPlaylistAdd);

export const AddIcon = createIcon(MdAdd);

export const BulkSelectIcon = createIcon(MdChecklist);

export const CheckIcon = createIcon(MdCheck);

export const CloseIcon = createIcon(MdClose);

export const ColorPickerIcon = createIcon(MdColorize);

export const CommandKeyIcon = createIcon(MdOutlineKeyboardCommandKey);

export const ComposeIssueIcon = createIcon(IoPencilSharp);

export const CopyIcon = createIcon(BiSolidCopy);

export const DeleteIcon = createIcon(MdDelete);

export const DragHandleIcon = createIcon(MdDragIndicator);

export const DuplicateIcon = createIcon(LuCopyPlus);

export const EditIcon = createIcon(MdEdit);

export const EnterKeyIcon = createIcon(GrReturn);

export const ExpandImageIcon = createIcon(MdZoomOutMap);

export const ExternalLinkIcon = createIcon(LuExternalLink);

export const HideSecretIcon = createIcon(MdVisibilityOff);

export const ImportUploadIcon = createIcon(MdUpload);

export const InvitationPendingIcon = createIcon(MdJoinLeft);

export const InviteMemberIcon = createIcon(HiUserPlus);

export const LogoutIcon = createIcon(MdLogout);

export const ReplyIcon = createIcon(BsReply);

export const RevealSecretIcon = createIcon(MdVisibility);

export const RevokeInviteIcon = createIcon(MdPersonRemove);

export const RunnerIcon = createIcon(MdStorage);

export const SettingsGeneralIcon = createIcon(HiPencilSquare);
