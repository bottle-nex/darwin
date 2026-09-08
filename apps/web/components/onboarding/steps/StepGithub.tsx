"use client";
import { GithubLogoIcon } from "@trydarwin/ui/icons";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { StepItem } from "../StepFrame";

export default function StepGithub({
    repoFullName,
    connecting,
    onConnect,
}: {
    repoFullName?: string | null;
    connecting?: boolean;
    onConnect: () => void;
}) {
    const connected = Boolean(repoFullName);

    return (
        <>
            <StepItem>
                <Label className="text-[13px] text-neutral-500">Repository</Label>
                <div className="mt-1.5 flex h-11 items-center gap-3 border-b border-white/12">
                    <GithubLogoIcon className="size-5 shrink-0 text-neutral-400" />
                    <span
                        className={cn(
                            "truncate font-mono text-[15px]",
                            connected ? "text-neutral-200" : "text-neutral-600",
                        )}
                    >
                        {repoFullName ?? "No repository linked"}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-2 text-[13px] text-neutral-600">
                        <span
                            className={cn(
                                "size-1.5 rounded-full",
                                connected ? "bg-matcha" : "bg-neutral-700",
                            )}
                        />
                        {connected ? "connected" : "not connected"}
                    </span>
                </div>
            </StepItem>
            <StepItem className="flex items-center gap-5">
                {connected ? (
                    <span className="text-[13px] text-neutral-600">
                        Pull requests land here for your review.
                    </span>
                ) : (
                    <>
                        <Button variant="secondary" loading={connecting} onClick={onConnect}>
                            <GithubLogoIcon />
                            Connect GitHub
                        </Button>
                        <span className="text-[13px] text-neutral-600">
                            Your answers are saved before you leave.
                        </span>
                    </>
                )}
            </StepItem>
        </>
    );
}
