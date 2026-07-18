import { stats } from "./data";

export default function StatsRow() {
    return (
        <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-4 sm:justify-between">
            {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                    <p className="text-2xl font-medium text-neutral-900 sm:text-3xl">
                        {stat.value}
                    </p>
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}
