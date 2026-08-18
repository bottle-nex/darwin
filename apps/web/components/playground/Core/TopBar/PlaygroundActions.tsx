"use client";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import NotificationsBellButton from "./NotificationsBellButton";
import { Button } from "@/components/ui/button";
import { BsPlus } from "react-icons/bs";
import { COMBINATIONS } from "@/hooks/shortcuts/usePlaygroundShortcuts";

export default function PlaygroundActions() {
    return (
        <div className="flex items-center gap-2.5 -mt-1 -mr-2">
            <TooltipComponent content="Toggle notifications" side="bottom" delayDuration={500}>
                <NotificationsBellButton />
            </TooltipComponent>
            <Button
                variant="tertiary"
                size="xs"
                className="pl-2! rounded-sm pr-3!"
                onClick={() => COMBINATIONS["n i"].run()}
            >
                <BsPlus className="size-4 text-ink!" />
                Create Issue
            </Button>
            {/*<TokenCreditsBar />*/}
        </div>
    );
}
