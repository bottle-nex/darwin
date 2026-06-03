import { Input } from "@/components/ui/input";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Button } from "../ui/button";
import { IoAddSharp } from "react-icons/io5";

export default function PlaygroundPill() {
    return (
        <main className="size-full overflow-hidden border-px border-neutral-800 bg-[#111111] ring-1 ring-white/5">
            <section className="w-full h-10 flex items-center justify-between pt-4 px-6">
                <span />
                <div className="relative max-w-lg w-full">
                    <PiMagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-[#737373]" />
                    <span className="pointer-events-none absolute top-1/2 right-4 z-10 size-4 -translate-y-1/2 text-[#737373] text-xs">
                        /
                    </span>

                    <Input className="w-full pl-11 rounded-[14px]" placeholder="Search" />
                </div>
                <Button>
                    <IoAddSharp />
                    Create Org
                </Button>
            </section>
        </main>
    );
}
