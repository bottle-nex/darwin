import { cn } from "@/lib/utils";
import HeroBuddy from "../landing/v2/HeroBuddy";
import { IoIosPlayCircle } from "react-icons/io";
import HeroPanel from "./HeroPanel";

export default function LandingHero() {
    return (
        <div
            className={cn(
                "relative h-screen w-screen max-w-7xl mx-auto bg-transparent flex flex-col items-center pt-[11%] border-b overflow-hidden",
            )}
        >
            <div
                className={cn(
                    "buddy-zone flex items-center gap-2 rounded-full border border-primary/15 px-3 py-1 text-[10px] uppercase tracking-wide text-[#434512] shadow-sm bg-white",
                )}
            >
                <HeroBuddy className="size-6 -my-1" />
                The agent-native board
            </div>

            <div
                className={cn(
                    // sourceSerif4.className,
                    "pt-8 text-6xl text-[#434152] tracking-tight font-medium w-full text-center flex justify-center leading-none",
                )}
            >
                Issues that implement themselves
            </div>
            <div className="pt-4 text-[1.09rem] text-[#2A252490] w-140 text-center flex justify-center leading-[1.2]">
                Agents claim work off your board, run your codebase <br /> in a sandbox, and ship a
                PR.
            </div>

            <div className="flex gap-3 pt-8">
                <button className="bg-[#2A2524] text-[#f5f3f8] px-4 py-2 font-medium rounded-md cursor-pointer text-[15px]">
                    Get Started
                </button>
                <button className="bg-[#F4EDE3] text-[#2A2524] px-4 py-2 font-medium rounded-md cursor-pointer text-[15px] flex items-center gap-1.5">
                    How it works
                    <IoIosPlayCircle className="text-[#2a2524] size-4.5" />
                </button>
            </div>

            <HeroPanel />
        </div>
    );
}
