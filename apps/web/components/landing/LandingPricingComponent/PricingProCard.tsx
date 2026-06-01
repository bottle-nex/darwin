"use client";
import { cn } from "@/lib/utils";
import { JSX } from "react";
import { LuCheck } from "react-icons/lu";
import { Caveat } from "next/font/google";
import { Button } from "../../ui/button";

const caveat = Caveat({
    subsets: ["latin"],
    weight: ["600", "700"],
});

const proFeatures = [
    "Everything in Starter",
    "500 PRs auto-resolved / month",
    "Failing CI & test auto-repair",
    "Unlimited repos & teammates",
    "Priority email support",
];

export default function PricingProCard(): JSX.Element {
    return (
        <div
            className={cn(
                "rounded-4xl bg-cyan-500 p-3 scale-105",
                "outline-1 outline-cyan-500 outline-offset-1 ring-1 ring-cyan-600/30",
                "shadow-[inset_0_0_12px_rgba(0,0,0,0.25)]",
            )}
        >
            <div
                className={cn(
                    "w-85 h-105 p-7 bg-white rounded-3xl",
                    "flex flex-col gap-4 shadow-xl shadow-black/10",
                )}
            >
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <span className="font-bold text-2xl tracking-tight leading-tight">Pro</span>
                        <span className="font-medium text-neutral-400 text-sm">
                            For shipping teams
                        </span>
                    </div>
                    <span
                        className={cn(
                            caveat.className,
                            "text-2xl text-cyan-500 leading-none mt-1 -rotate-6",
                        )}
                    >
                        Popular!
                    </span>
                </div>

                <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-bold tracking-tight leading-none">$59</span>
                    <span className="text-base text-neutral-400 font-normal mb-1.5">/mo</span>
                </div>

                <div className="h-px w-full bg-neutral-200" />

                <ul className="flex flex-col gap-2">
                    {proFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-neutral-600">
                            <LuCheck className="size-4 text-neutral-400 shrink-0" strokeWidth={2} />
                            <span className="text-[15px] tracking-tight">{feature}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    type="button"
                    className={cn(
                        "w-full py-4 mt-auto h-11",
                        "bg-black text-white rounded-lg",
                        "font-semibold text-[15px] tracking-tight",
                    )}
                >
                    Choose Pro
                </Button>
            </div>
        </div>
    );
}
