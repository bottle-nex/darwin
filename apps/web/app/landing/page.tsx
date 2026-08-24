import { Button } from "@/components/ui/button";

import Dial from "./dial";

export default function Landing() {
    return (
        <div className="min-h-screen bg-neutral-900 p-3">
            <div className="relative min-h-[calc(100vh-1.5rem)] bg-snow overflow-hidden rounded-2xl ">
                {/* Hero content */}
                <div className="absolute z-50 bottom-16 left-12 flex flex-col gap-5 max-w-lg">
                    <div className="flex items-center gap-2 w-fit rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5">
                        <span className="size-2 rounded-full bg-white/80" />
                        <span className="text-xs text-white/80 font-medium">
                            Beta Version is Live!
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <h1 className="text-5xl font-semibold text-white leading-tight">
                            Automate Smarter.
                        </h1>
                        <h1 className="text-5xl font-semibold text-white leading-tight">
                            Work <em className="font-serif font-normal">Faster;</em>
                        </h1>
                    </div>

                    <p className="text-sm text-white/60 leading-relaxed">
                        Say goodbye to repetitive tasks. Our AI-driven platform streamlines your
                        workflows so your team can focus on what really matters.
                    </p>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="unstyled"
                            className="rounded-full bg-white text-neutral-900 text-sm font-medium px-5 py-2.5 hover:bg-white/90 transition-colors"
                        >
                            See It in Action
                        </Button>
                        <Button
                            variant="unstyled"
                            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 hover:bg-white/20 transition-colors"
                        >
                            Demo <span className="text-xs">▶</span>
                        </Button>
                    </div>
                </div>

                <Dial
                    size={1300}
                    color={"#fafafa"}
                    tick={{
                        size: 73,
                        width: 3.5,
                        color: "#ababab90",
                        opacity: 0.3,
                        count: 100,
                    }}
                    padding={32}
                    className="absolute z-10 -bottom-150 -right-150 "
                    shadow={{ blur: 20, color: "#00000025" }}
                    rotation={{
                        angle: 5,
                        interval: 2,
                        direction: "clockwise",
                    }}
                />
                <Dial
                    size={1095}
                    color={"var(--color-primary)"}
                    tick={{
                        size: 43,
                        width: 3.5,
                        color: "#E6E7ED",
                        opacity: 0.3,
                        count: 100,
                    }}
                    className="absolute z-20 -bottom-130 -right-130 "
                    shadow={{ blur: 20, color: "#00000025" }}
                    rotation={{
                        angle: 5,
                        interval: 2,
                        direction: "counterclockwise",
                    }}
                />
                <Dial
                    size={900}
                    color={"var(--color-primary)"}
                    tick={{
                        size: 0,
                        width: 0,
                        color: "#ababab90",
                        opacity: 0.3,
                        count: 100,
                    }}
                    className="absolute z-30 -bottom-110 -right-110 "
                    shadow={{ blur: 20, color: "#00000025" }}
                />
            </div>
        </div>
    );
}
