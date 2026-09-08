"use client";
import { CommandKeyIcon, EnterKeyIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function handleDialogSubmitKey(event: React.KeyboardEvent, submit: () => void) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
    }
}

export default function DialogSubmitButton({
    label,
    onClick,
    loading,
    disabled,
}: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
}) {
    const [isMac] = useState(() => /Mac|iPhone|iPad/.test(navigator.userAgent));

    return (
        <Button
            type="button"
            variant="flat-primary"
            size="sm"
            onClick={onClick}
            loading={loading}
            disabled={disabled}
        >
            {label}
            <span className="ml-0.5 flex items-center gap-0.5">
                {isMac ? <CommandKeyIcon /> : <span className="text-[10px]">Ctrl</span>}
                <EnterKeyIcon />
            </span>
        </Button>
    );
}
