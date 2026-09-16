"use client";
import { AutonomousModeIcon, ManualModeIcon } from "@trydarwin/ui/icons";

import { EXECUTION_MODE_OPTIONS, type ExecutionMode } from "@/types/project";

import Capsule, { type CapsuleOption } from "./Capsule";

const EXECUTION_MODE_ICON: Record<ExecutionMode, CapsuleOption["icon"]> = {
    Autonomous: AutonomousModeIcon,
    Manual: ManualModeIcon,
};

const EXECUTION_MODE_CAPSULE_OPTIONS: CapsuleOption[] = EXECUTION_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
    icon: EXECUTION_MODE_ICON[option.id],
}));

export default function ExecutionModeCapsule({
    value,
    onChange,
    disabled,
    className,
}: {
    value?: ExecutionMode;
    onChange?: (value: ExecutionMode) => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <Capsule
            type="dropdown"
            options={EXECUTION_MODE_CAPSULE_OPTIONS}
            value={value}
            onChange={(next) => onChange?.(next as ExecutionMode)}
            disabled={disabled}
            className={className}
        />
    );
}
