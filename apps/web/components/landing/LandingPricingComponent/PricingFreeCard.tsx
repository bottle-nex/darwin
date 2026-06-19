"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { FiHome, FiBarChart2, FiPlus, FiBell, FiUser } from "react-icons/fi";
import { HiMiniChevronRight } from "react-icons/hi2";
import { MdOutlineReadMore } from "react-icons/md";
import { Button } from "@/components/ui/button";

const COMMITS = [
    {
        tag: "bug",
        id: "#150",
        title: "Fix memory leak in the editor",
        progress: 25,
    },
    {
        tag: "feat",
        id: "#149",
        title: "Add dark mode toggle",
        progress: 60,
    },
    {
        tag: "chore",
        id: "#148",
        title: "Bump dependencies to latest",
        progress: 85,
    },
];

const NAV_ICONS = [
    { Icon: FiHome },
    { Icon: FiBarChart2 },
    { Icon: FiPlus, highlight: true },
    { Icon: FiBell },
    { Icon: FiUser },
];

export default function PricingFreeCard() {
    const [hovered, setHovered] = useState<boolean>(false);

    return (
        <div
            className="w-full lg:h-full lg:w-1/2 bg-[#0D0D0D] rounded-4xl relative overflow-hidden"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 h-90 w-75 rounded-b-[3rem] bg-[#121212] border-8 border-[#202020] shadow-2xl shadow-black p-2">
                <div className="h-full w-full bg-[#202020] rounded-b-4xl flex flex-col relative">
                    <div className="flex-1 pt-4 px-2.5 flex flex-col gap-1.5">
                        {COMMITS.map((c, i) => (
                            <div key={i} className="bg-neutral-800/70 rounded-xl p-2.5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-white" />
                                        <span className="text-[8px] bg-neutral-700 text-white px-1.5 py-0.5 rounded-full leading-none">
                                            {c.tag}
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-neutral-500">{c.id}</span>
                                </div>
                                <h3 className="text-white text-[10px] font-medium leading-tight">
                                    {c.title}
                                </h3>
                                <div className="mt-1.5 h-0.5 bg-neutral-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white"
                                        style={{ width: `${c.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        <motion.div
                            className="bg-charcoal rounded-xl p-2.5 origin-center"
                            animate={{
                                scale: hovered ? 1.18 : 1,
                                rotate: hovered ? -2 : 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 14,
                                mass: 0.9,
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-white" />
                                    <span className="text-[8px] bg-neutral-700 text-white px-1.5 py-0.5 rounded-full leading-none">
                                        ui
                                    </span>
                                </div>
                                <span className="text-[8px] text-neutral-500">#1927</span>
                            </div>
                            <h3 className="text-white text-[10px] font-medium leading-tight">
                                Fix the dashboard design
                            </h3>
                            <div className="mt-1.5 h-0.5 bg-neutral-700 rounded-full overflow-hidden relative">
                                {hovered && (
                                    <motion.div
                                        className="absolute top-0 h-full w-1/3 bg-white rounded-full"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "300%" }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="h-13 bg-neutral-900 border-t border-neutral-800/60 flex items-center justify-around px-3 pb-1 rounded-b-4xl">
                        {NAV_ICONS.map(({ Icon, highlight }, i) =>
                            highlight ? (
                                <div
                                    key={i}
                                    className="bg-primary rounded-full size-7 flex items-center justify-center"
                                >
                                    <Icon className="size-3.5 text-black" />
                                </div>
                            ) : (
                                <Icon key={i} className="size-4 text-neutral-500" />
                            ),
                        )}
                    </div>

                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 h-0.75 w-22 bg-neutral-700/60 rounded-full" />
                </div>
            </div>

            <div className="h-full w-full mt-88 lg:mt-[61%] px-6 flex flex-col max-w-md mx-auto items-center gap-y-2">
                <div className="text-neutral-300 text-3xl">Explore for free</div>

                <div className="text-neutral-500 text-[17px] leading-[1.4] text-center">
                    Try Matcha for free, create an organization, add projects, add an issue, raise a
                    pr and let our matcha agent handle the bug with minor approvals.
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-x-4 items-center justify-center mt-5 pb-10">
                    <Button size={'lg'}>
                        Get Started
                        <HiMiniChevronRight className="size-5.5" />
                    </Button>

                    <Button size={'lg'} variant={'tertiary'}>
                        Know more
                        <MdOutlineReadMore className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
