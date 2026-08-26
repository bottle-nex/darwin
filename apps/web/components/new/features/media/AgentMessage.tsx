import type { ReactNode } from "react";

import AppLogo from "@/components/app/Applogo";

/**
 * The chat mock the feature cards' upper sections start out with: a message
 * bubble with the matcha tile beneath it.
 *
 * A convenience, not a constraint — a card's media component is free to drop this
 * and render something else entirely. Positions are absolute against the media
 * panel, which is the positioning context.
 */
export default function AgentMessage({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="absolute left-14 top-[34%] rounded-lg bg-white px-3.5 py-2 text-[12.5px] text-[#2a2524] shadow-sm shadow-black/10">
                {children}
            </div>

            <div className="absolute left-6 top-[58%] flex size-8 items-center justify-center rounded-md bg-primary">
                <AppLogo iconOnly size={14} className="text-white" />
            </div>
        </>
    );
}
