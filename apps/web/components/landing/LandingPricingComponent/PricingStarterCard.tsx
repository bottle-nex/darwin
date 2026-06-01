"use client";
import { cn } from "@/lib/utils";
import { JSX } from "react";
import { LuCheck } from "react-icons/lu";
import { Button } from "../../ui/button";

const starterFeatures = [
    "50 PRs auto-resolved / month",
    "AI code review on every PR",
    "Auto-fix lint & format issues",
    "1 connected GitHub repo",
    "Community support",
];

export default function PricingStarterCard(): JSX.Element {
    return (
        <div
            className={cn(
                "w-85 h-105 p-7 bg-white rounded-3xl",
                "ring-1 ring-black/10 shadow-xl shadow-black/10",
                "flex flex-col gap-4",
            )}
        >
            <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tight leading-tight">Starter</span>
                <span className="font-medium text-neutral-400 text-sm">
                    For solo devs & side projects
                </span>
            </div>

            <div className="flex items-end gap-1.5">
                <span className="text-5xl font-bold tracking-tight leading-none">$29</span>
                <span className="text-base text-neutral-400 font-normal mb-1.5">/mo</span>
            </div>

            <div className="h-px w-full bg-neutral-200" />

            <ul className="flex flex-col gap-2">
                {starterFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-neutral-600">
                        <LuCheck className="size-4 text-neutral-400 shrink-0" strokeWidth={2} />
                        <span className="text-[15px] tracking-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                type="button"
                className={cn(
                    "w-full py-4 mt-2 h-11",
                    "bg-black text-white rounded-lg",
                    "font-semibold text-[15px] tracking-tight",
                )}
            >
                Choose Starter
            </Button>
        </div>
    );
}
