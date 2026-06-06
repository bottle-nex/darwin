import { LayoutGrid, MoreVertical } from "lucide-react";
import type { TeamStat } from "./data";

export default function PlaygroundTeamStats({ stats }: { stats: TeamStat[] }) {
    return (
        <section className="rounded-xl ring-1 ring-white/5 bg-charcoal p-3">
            <div className="mb-3 flex items-center gap-2">
                <LayoutGrid className="size-4 text-neutral-400" aria-hidden />
                <h3 className="text-[15px] font-medium text-neutral-100">Team Members</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.id}
                            className="rounded-xl border border-white/5 bg-white/2 p-3 px-4"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[12px] text-neutral-500">{stat.label}</p>
                                <div className="h-6 w-6 rounded-sm group cursor-pointer hover:bg-neutral-800/70 flex justify-center items-center transition-colors transform duration-200">
                                    <MoreVertical
                                        className="size-4 text-neutral-600  group-hover:text-neutral-300 transition-colors transform duration-200"
                                        aria-hidden
                                    />
                                </div>
                            </div>

                            <p className="mt-1.5">
                                <span className="text-[19px] font-semibold text-neutral-100">
                                    {stat.value}
                                </span>
                                <span className="ml-1.5 text-[14px] text-neutral-400">
                                    {stat.unit}
                                </span>
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">{stat.caption}</p>

                            <div className="mt-2.5 flex items-center gap-3.5 border-t border-white/5 pt-2.5 text-[12px] text-neutral-400 -mx-4 px-4">
                                <Icon className="size-3.5 text-neutral-500" aria-hidden />
                                {stat.trend}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
