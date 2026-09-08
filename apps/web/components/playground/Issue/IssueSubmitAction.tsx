"use client";
import { CommandKeyIcon, EnterKeyIcon } from "@trydarwin/ui/icons";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import SubmitWarningToast from "./SubmitWarningToast";
import type { IssueFormState } from "./useIssueForm";

export default function IssueSubmitAction({
    form,
    className,
    warningPlacement = "above",
    showWarning = true,
}: {
    form: IssueFormState;
    className?: string;
    warningPlacement?: "above" | "below";
    showWarning?: boolean;
}) {
    const { body, submit, pending, warning, shakeControls, isEdit, isCustom, isMac, readOnly } =
        form;

    // Editing an existing issue autosaves on exit — this button only covers creating a new one.
    if (readOnly || isEdit) return null;

    return (
        <section className={cn("h-fit flex items-center justify-end", className)}>
            <div className="flex items-center justify-end gap-x-2">
                {!isCustom && body.prompts > 0 && (
                    <span className="shrink-0 text-xs text-white/45">
                        {body.prompts} field{body.prompts === 1 ? "" : "s"} left
                    </span>
                )}
                <div className="relative isolate">
                    {showWarning && (
                        <SubmitWarningToast warning={warning} placement={warningPlacement} />
                    )}
                    <motion.div animate={shakeControls} className="relative z-10">
                        <Button variant="flat-primary" size="sm" onClick={submit} loading={pending}>
                            Create Issue
                            <ShortcutHint>
                                {isMac ? (
                                    <CommandKeyIcon />
                                ) : (
                                    <span className="text-[10px]">Ctrl</span>
                                )}
                                <EnterKeyIcon />
                            </ShortcutHint>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function ShortcutHint({ children }: { children: ReactNode }) {
    return <span className="ml-0.5 flex items-center gap-0.5">{children}</span>;
}
