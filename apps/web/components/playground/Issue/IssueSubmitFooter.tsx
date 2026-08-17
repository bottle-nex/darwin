"use client";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { LuInfo } from "react-icons/lu";
import { MdOutlineKeyboardCommandKey } from "react-icons/md";
import { GrReturn } from "react-icons/gr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SubmitWarningToast from "./SubmitWarningToast";
import type { IssueFormState } from "./useIssueForm";

export default function IssueSubmitFooter({
    form,
    className,
}: {
    form: IssueFormState;
    className?: string;
}) {
    const { body, submit, pending, warning, shakeControls, isEdit, isCustom, isMac, readOnly } =
        form;

    if (readOnly) {
        return (
            <section className={cn("h-fit flex items-center", className)}>
                <div className="flex items-center gap-x-1 text-xs text-white/70">
                    <LuInfo size={10} />
                    <span>
                        The agent has picked this issue up. It can&apos;t be edited while it runs.
                    </span>
                </div>
            </section>
        );
    }

    return (
        <section className={cn("h-fit flex items-center justify-end", className)}>
            <div className="flex items-center justify-end gap-x-2">
                {!isEdit && !isCustom && body.prompts > 0 && (
                    <span className="shrink-0 text-xs text-white/45">
                        {body.prompts} field{body.prompts === 1 ? "" : "s"} left
                    </span>
                )}
                <div className="relative isolate">
                    <SubmitWarningToast warning={warning} />
                    <motion.div animate={shakeControls} className="relative z-10">
                        <Button
                            variant="tertiary"
                            size="xs"
                            className="text-ink!"
                            onClick={submit}
                            loading={pending}
                        >
                            {isEdit ? "Save" : "Create Issue"}
                            <ShortcutHint>
                                {isMac ? (
                                    <MdOutlineKeyboardCommandKey className="text-ink!" />
                                ) : (
                                    <span className="text-[10px] text-ink!">Ctrl</span>
                                )}
                                <GrReturn className="text-ink!" />
                            </ShortcutHint>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function ShortcutHint({ children }: { children: ReactNode }) {
    return (
        <span className="ml-0.5 flex items-center gap-0.5 text-ink/40 [&_svg]:text-ink/40!">
            {children}
        </span>
    );
}
