import { cn } from "@/lib/utils";
import HeroBuddy from "../landing/v2/HeroBuddy";
import { Source_Serif_4 } from "next/font/google";
import { IoIosPlayCircle } from "react-icons/io";
import ExpandingPanel from "./ExpandingPanel";
import PanelContentBefore from "./PanelContentBefore";

const sourceSerif4 = Source_Serif_4({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

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

            {/* <div className="w-full h-full flex justify-center items-end">
                <div className="h-95 shrink-0 mt-3 w-5xl border-t border-l border-r border-black/8 shadow-sm shadow-black/5 rounded-t-2xl flex flex-col px-6 py-4 bg-white">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex gap-1 items-center">
                            <div className="h-3 w-3 rounded-full bg-[#e1e0eb]" />
                            <div className="h-3 w-3 rounded-full bg-[#e1e0eb]" />
                            <div className="h-3 w-3 rounded-full bg-[#e1e0eb]" />
                        </div>

                        <div className="flex rounded-full bg-primary/40 items-center px-1 py-1 text-[13px] font-medium">
                            <div className="px-3 bg-white rounded-full py-1 tracking-tight">
                                Issues
                            </div>
                            <div className="px-3 py-1 text-[#726a9f] tracking-tight">Review</div>
                        </div>

                        <AppLogo iconOnly size={15} />
                    </div>

                    <div className="w-full h-full flex flex-col pt-6 px-4">
                        <div className="text-[13px] tracking-tight font-medium text-[#434152]">
                            Today
                        </div>

                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress3Line className="text-primary size-4" />
                            OTP verify returns 500 when the attempts key expires
                            <span className="text-xs pt-px font-medium text-[#928eac]">#231</span>
                        </div>
                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress5Line className="text-[#e47534] size-4" />
                            Rate limit /auth/otp/request per email and IP
                            <span className="text-xs pt-px font-medium text-[#928eac]">#229</span>
                        </div>
                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress7Line className="text-[#26b33b] size-4" />
                            Board cards lose their order after a page refresh
                            <span className="text-xs pt-px font-medium text-[#928eac]">#227</span>
                        </div>
                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress5Line className="text-[#e43434] size-4" />
                            Mention autocomplete fires inside fenced code blocks
                            <span className="text-xs pt-px font-medium text-[#928eac]">#215</span>
                        </div>

                        <div className="text-[13px] tracking-tight font-medium text-[#434152] mt-8">
                            Yesterday
                        </div>

                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress3Line className="text-[#26b33b] size-4" />
                            Prisma client leaks connections across HMR reloads
                            <span className="text-xs pt-px font-medium text-[#928eac]">#224</span>
                        </div>

                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress5Line className="text-[#e43434] size-4" />
                            Session JWT is not cleared on sign out
                            <span className="text-xs pt-px font-medium text-[#928eac]">#221</span>
                        </div>
                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress7Line className="text-[#26b33b] size-4" />
                            Runner times out cloning repos with large lockfiles
                            <span className="text-xs pt-px font-medium text-[#928eac]">#218</span>
                        </div>
                        <div className="flex gap-2 items-center text-[13px] mt-2 px-1">
                            <RiProgress7Line className="text-[#26b33b] size-4" />
                            Notification count drifts after mark all as read
                            <span className="text-xs pt-px font-medium text-[#928eac]">#212</span>
                        </div>
                    </div>
                </div>
            </div> */}
            <div className="relative w-full h-[90vh] mt-25">
                <ExpandingPanel className="bg-[#141413] h-[110vh]">
                    <div className="w-full h-full flex items-center justify-center">
                        <PanelContentBefore />
                    </div>
                </ExpandingPanel>
            </div>
        </div>
    );
}
