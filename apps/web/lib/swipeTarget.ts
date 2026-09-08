import { SwipeTarget } from "@trydarwin/types";
import {
    AskDarwinIcon,
    DisabledIcon,
    type IconType,
    SettingsOverviewIcon,
} from "@trydarwin/ui/icons";

export const SWIPE_TARGETS: { value: SwipeTarget; label: string; icon: IconType }[] = [
    { value: SwipeTarget.Settings, label: "Settings", icon: SettingsOverviewIcon },
    { value: SwipeTarget.Darwin, label: "Darwin chats", icon: AskDarwinIcon },
    { value: SwipeTarget.Off, label: "Off", icon: DisabledIcon },
];
