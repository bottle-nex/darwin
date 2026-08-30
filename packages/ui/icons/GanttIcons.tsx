import { createIcon } from "./createIcon";
import { MdBlock, MdErrorOutline, MdPause } from "react-icons/md";

export const CancelledCardIcon = createIcon(MdBlock);

export const PausedStateIcon = createIcon(MdPause);

export const RunFailedIcon = createIcon(MdErrorOutline);
