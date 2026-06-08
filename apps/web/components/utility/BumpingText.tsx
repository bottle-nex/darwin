import { cn } from "@/lib/utils";
import { useAnimate } from "framer-motion";
import { useEffect } from "react";

export function BumpingText({ text, isSelected, trigger }: { text: string; isSelected: boolean; trigger: number }) {
    const [scope, animate] = useAnimate();

    useEffect(() => {
        if (trigger === 0) return;
        const chars = scope.current?.querySelectorAll("[data-char]");
        if (!chars) return;
        chars.forEach((el: Element, i: number) => {
            animate(el as HTMLElement, { y: [0, -3, 0] }, {
                duration: 0.35,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
            });
        });
    }, [trigger]);

    return (
        <span ref={scope} className="inline-flex flex-wrap">
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    data-char
                    className={cn(
                        "text-[12px] transition-colors duration-200",
                        isSelected ? "text-white" : "text-neutral-500",
                    )}
                >
                    {char === " " ? " " : char}
                </span>
            ))}
        </span>
    );
}
