import { cn } from "@/lib/utils";
import { sourceSerif4 } from "@/lib/fonts";

export default function PanelContentBefore() {
    return (
        <div className="flex flex-col items-center gap-6">
            <div
                className={cn(
                    "max-w-[50rem] font-medium text-center text-white text-[3.5rem] leading-[1.1]",
                    sourceSerif4.className,
                )}
            >
                Every issue on your board is already being worked on.
            </div>

            <div className="text-center max-w-2xl text-[#f0eff8] text-[1.2rem]">
                Drop the work on the board and walk away. Issues get claimed, implemented, and
                verified, you come back to PRs.
            </div>

            <button className="bg-[#f0eff8] text-[#141413] px-4 py-1.75 font-medium rounded-md cursor-pointer text-[14px] shadow-xs shadow-black/5">
                Get Started
            </button>
        </div>
    );
}
