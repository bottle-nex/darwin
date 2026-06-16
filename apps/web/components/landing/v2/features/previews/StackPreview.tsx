import { cn } from "@/lib/utils";

type Mini = { id: string; title: string; tag: string; tagClass: string; dot: string };

/** Light, tagged run cards — the work the runner is churning through. */
const CARDS: Mini[] = [
    {
        id: "#150",
        title: "Fix memory leak in the board editor",
        tag: "tests",
        tagClass: "bg-emerald-100 text-emerald-700",
        dot: "bg-rose-500",
    },
    {
        id: "#149",
        title: "Add keyboard shortcuts panel",
        tag: "build",
        tagClass: "bg-sky-100 text-sky-700",
        dot: "bg-amber-400",
    },
];

export default function StackPreview() {
    return (
        // Negative bottom margin lets the stack reach + bleed past the card's
        // padded edge; the card's overflow-hidden crops it like the real app.
        <div className="relative -mb-8 mt-1 sm:-mb-10">
            {/* Solid receding panels behind the front card → paper-stack depth. */}
            <div className="mx-auto h-5 w-[74%] rounded-t-xl bg-white/75" />
            <div className="mx-auto -mt-2 h-5 w-[87%] rounded-t-xl bg-white/90" />
            <div className="relative -mt-2 rounded-xl bg-white p-3 shadow-[0_-2px_28px_rgba(28,18,70,0.22)] ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transform-none">
                <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium text-neutral-500">
                    <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:hidden" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                    </span>
                    prod-worker-1 · running
                </div>
                <div className="flex flex-col gap-2">
                    {CARDS.map((card) => (
                        <div
                            key={card.id}
                            className="rounded-lg border border-neutral-200 bg-white p-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("size-1.5 rounded-full", card.dot)} />
                                    <span
                                        className={cn(
                                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                            card.tagClass,
                                        )}
                                    >
                                        {card.tag}
                                    </span>
                                </div>
                                <span className="font-mono text-[10px] text-neutral-400">
                                    {card.id}
                                </span>
                            </div>
                            <p className="mt-1.5 text-[12px] font-medium leading-snug text-neutral-800">
                                {card.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
